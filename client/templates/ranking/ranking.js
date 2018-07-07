import { Collections } from "/lib/declarations";

Template.rank_item.helpers({
	getName() {
		return this.name;
	},
	labelClass() {
		if (this.win_point > 0) return "success";
		else if (this.win_point === 0) return "primary";
		else return "danger";
	},
	showBalance() {
		return Template.parentData(1).showBalance;
	},
	balance() {
		let data = this;
		let transfers = Collections.Transfers.find({$or: [{from: data._id}, {to: data._id}]});
		let transfer = {s: 0, r: 0};
		transfers.forEach(t => {
		if (t.from === data._id) {
			transfer.s += t.amount;
		} else {
			transfer.r += t.amount;
		}
		});
		// save transfers for later accessing in transfers helper
		Template.instance().transfer = transfer;

		return this.init_point + this.win_point - transfer.s + transfer.r;
	},
	transfers() {
		let formatFloat = Blaze._globalHelpers.formatFloat;
		let transfer = Template.instance().transfer;
		return formatFloat(transfer.s) + "/" + formatFloat(transfer.r);
	},
});
