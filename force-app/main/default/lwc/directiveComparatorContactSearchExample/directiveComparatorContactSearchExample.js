import { LightningElement, wire } from "lwc";
import { comparator, STRING_VALUE } from "c/directiveComparator";
import getContacts from "@salesforce/apex/DirectiveExampleController.getContacts";

export default class DirectiveComparatorContactSearchExample extends LightningElement {
  contactId = null;

  keywordInput = "";

  keyword = "";

  @wire(getContacts, { keyword: "$keyword" })
  contacts;

  $ = comparator(
    this,
    {
      contactId: STRING_VALUE,
      keywordInput: STRING_VALUE,
      contacts: {
        data: []
      }
    },
    {
      constants: {
        five: 5
      }
    }
  );

  handleChangeKeywordInput(e) {
    this.keywordInput = e.target.value;
  }

  handleKeydownKeywordInput(e) {
    if (e.key === "Enter" && !e.isComposing && e.keyCode !== 229) {
      if (this.keywordInput !== this.keyword) {
        // this.contacts = null;
        this.keyword = this.keywordInput;
      }
    }
  }

  handleClickContact(event) {
    this.contactId = event.target.dataset.id;
  }
}
