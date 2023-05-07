import { LightningElement } from "lwc";
import { comparator, NUMBER_VALUE } from "c/directiveComparator";

export default class DirectiveComparatorIterationExample extends LightningElement {
  customerId = 1;

  customers = [
    { id: 1, fullName: "John Doe", rank: "gold" },
    { id: 2, fullName: "Amy Taylor", rank: "silver" },
    { id: 3, fullName: "Michael Jones", rank: "bronze" },
    { id: 4, fullName: "Jane Doe", rank: "silver" }
  ];

  $ = comparator(this, {
    customerId: NUMBER_VALUE,
    customers: [
      {
        id: NUMBER_VALUE,
        rank: ["gold", "silver", "bronze"]
      }
    ]
  });
}
