import { Jobs } from 'meteor/msavin:sjobs';
import { Collections } from "../../lib/declarations";

Jobs.register({
	"updatePoint": function(data) {
		let match = Collections.Matches.findOne(data.matchId);
		// lazy checking: if match name has no " vs " then it is just a future and is not required to bet.
		let isMatch = match.name.match(/ vs /i) !== null;
	
		if (isMatch) {
			//==== Take this chance to update players did not bet in this match.
			//==== Deduct a specific amount of credits from them.
			// First, get list of players who bet from slips
			let slips = Collections.Slips.find({matchId: data.matchId, bet: {$gte: 5}}, {fields: {playerId: 1}});
			let betPlayers = {};
			slips.forEach(slip => {
				return betPlayers[slip.playerId] = 1;
			});
			// Next, get the inverted list
			let notBetPlayers = Collections.Players.find({_id: {$nin: Object.keys(betPlayers)}}, {fields: {userId: 1}});
			// Finally, add to each player in the latter list a slip that would be never win
			notBetPlayers.forEach(player => {
				// create an invalid slip with a bet value
				Collections.Slips.insert({
					playerId: player._id,
					userId: player.userId,
					matchId: data.matchId,
					matchTime: match.time,
					marketIdx: -1,
					oddIdx: -1,
					oddValue: 1,
					bet: 5,
					won: 0
				});
			});
		}

		// update slips with result from match
		let markets = data.markets;
		slips = Collections.Slips.find({matchId: data.matchId, bet: {$exists: 1}});
		let players = {};
		// loop to update each slip
		slips.forEach(slip => {
			// update slips
			if (slip.marketIdx > -1) {
				// win value without original bet deduction.
				if (markets[slip.marketIdx].odds[slip.oddIdx].win) {
					slip.won = slip.bet * slip.oddValue;
				} else {
					slip.won = 0;
				}
				Collections.Slips.update(slip._id, {$set: {won: slip.won}});
			}
			players[slip.playerId] || (players[slip.playerId] = {win_sum: 0, bet_sum: 0});
			players[slip.playerId].userId = slip.userId;
			players[slip.playerId].win_sum += slip.won || 0;
			players[slip.playerId].bet_sum += slip.bet;
		});

		// Sums for updated match
		Object.keys(players).forEach(playerId => {
			if (!players[playerId].group) return;

			Collections.MatchSums.upsert({
				playerId: playerId,
				player_group: players[playerId].group,
				matchId: data.matchId
			}, {
				$set: {
					// for grouping matches in one day in VN time, add timeoffset here.
					// matchTime: moment(match.time).add(7, "hours").toDate(),
					matchTime: moment(match.time).toDate(),
					userId: players[playerId].userId,
					win_sum: players[playerId].win_sum,
					bet_sum: players[playerId].bet_sum,
					win_rate: (players[playerId].win_sum - players[playerId].bet_sum) / players[playerId].bet_sum,
					win_point: players[playerId].win_sum - players[playerId].bet_sum
				}
			});
		});

		// sums for one date by grouping matches in the same day
		players = {};
		Collections.MatchSums.find({
			// group matches in one day (VN time)
			matchTime: {
				$gte: moment(match.time).add(7, "hours").startOf("day").add(-7, "hours").toDate(),
				$lte: moment(match.time).add(7, "hours").endOf("day").add(-7, "hours").toDate()
			}
		}).forEach(matchsum => {
			players[matchsum.playerId] || (players[matchsum.playerId] = {win_sum: 0, bet_sum: 0});
			players[matchsum.playerId].userId = matchsum.userId;
			players[matchsum.playerId].win_sum += matchsum.win_sum;
			players[matchsum.playerId].bet_sum += matchsum.bet_sum;
		});

		let updateDate = moment(match.time).add(7, "hours").startOf("day").toDate();
		Object.keys(players).forEach(playerId => {
			if (!players[playerId].group) return;

			Collections.DateSums.upsert({
				playerId: playerId,
				player_group: players[playerId].group,
				date: updateDate
			}, {
				$set: {
					userId: players[playerId].userId,
					win_sum: players[playerId].win_sum,
					bet_sum: players[playerId].bet_sum,
					win_rate: (players[playerId].win_sum - players[playerId].bet_sum) / players[playerId].bet_sum,
					win_point: players[playerId].win_sum - players[playerId].bet_sum
				}
			});
		});

		// overall - save to players
		players = {};
		Collections.MatchSums.find({}).forEach(matchsum => {
			players[matchsum.playerId] || (players[matchsum.playerId] = {win_sum: 0, bet_sum: 0});
			players[matchsum.playerId].win_sum += matchsum.win_sum;
			players[matchsum.playerId].bet_sum += matchsum.bet_sum;
		});
		Object.keys(players).forEach(playerId => {
			Collections.Players.update(playerId, {
				$set: {
					win_sum: players[playerId].win_sum,
					bet_sum: players[playerId].bet_sum,
					win_rate: (players[playerId].win_sum - players[playerId].bet_sum) / players[playerId].bet_sum,
					win_point: players[playerId].win_sum - players[playerId].bet_sum
				}
			});
		});

		this.success();
		this.remove();
	}
});