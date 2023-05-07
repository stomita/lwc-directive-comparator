import { LightningElement, api } from "lwc";
import { comparator } from "c/directiveComparator";

export default class DirectiveComparatorSimpleExample extends LightningElement {
  @api
  rank;

  @api
  fullName;

  $ = comparator(this, {
    rank: ["gold", "silver", "bronze"]
  });
}
