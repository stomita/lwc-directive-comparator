import { comparator, STRING_VALUE, NUMBER_VALUE } from "c/directiveComparator";

describe("c-directive-comparator", () => {
  afterEach(() => {});

  const ACCOUNT1 = {
    Id: "acct1",
    Name: "Acme Corporation"
  };

  const CONTACTS = [
    {
      Id: "cont1",
      Name: "Amy Taylor",
      Title: "VP of Engineering",
      Account: ACCOUNT1
    },
    {
      Id: "cont2",
      Name: "Michael Jones",
      Title: "VP of Sales",
      Account: ACCOUNT1
    },
    { Id: "cont3", Name: "Jennifer Wu", Title: "CEO", Account: ACCOUNT1 },
    {
      Id: "cont4",
      Name: "John Doe",
      Title: "VP of Engineering",
      Account: ACCOUNT1
    },
    {
      Id: "cont5",
      Name: "Jane Doe",
      Title: "VP of Sales",
      Account: ACCOUNT1
    }
  ];

  it("check comparator works correctly", () => {
    const context = {
      contactId: "cont1",
      keyword: "or",
      account: ACCOUNT1,
      contacts: CONTACTS,
      get filteredContacts() {
        return this.contacts.filter((contact) =>
          contact.Name.toLowerCase().includes(this.keyword.toLowerCase())
        );
      }
    };
    const $ = comparator(context, {
      contactId: STRING_VALUE,
      keyword: STRING_VALUE,
      account: {
        Id: STRING_VALUE
      },
      contacts: [
        {
          Id: STRING_VALUE,
          Account: {
            Id: STRING_VALUE
          }
        }
      ],
      filteredContacts: []
    });
    expect($.contacts.length.gt.zero).toBe(true);
    expect($.filteredContacts.length.gt.zero).toBe(true);
    expect($.account.Name.includes.$keyword).toBe(true);
    for (const [index, contact] of [...$.contacts].entries()) {
      expect(
        index === 0
          ? contact.$.Id.equals.$contactId
          : contact.$.Id.not.equals.$contactId
      ).toBe(true);
      expect(contact.$.Account.Id.equals.$account.Id).toBe(true);
    }
    // mutate context property value
    context.contactId = "cont2";
    context.keyword = "Ad";
    expect($.account.Name.not.includes.$keyword).toBe(true);
    expect($.filteredContacts.isEmpty).toBe(true);
    for (const [index, contact] of [...$.contacts].entries()) {
      expect(
        index === 1
          ? contact.$.Id.equals.$contactId
          : contact.$.Id.not.equals.$contactId
      ).toBe(true);
    }
  });

  it("should accept constant definition", () => {
    const context = {
      type: "03. Competitor",
      limit: 100
    };
    const $ = comparator(
      context,
      {
        type: [
          ["customer", "01. Customer"],
          ["partner", "02. Partner"],
          ["competitor", "03. Competitor"]
        ],
        limit: NUMBER_VALUE
      },
      {
        constants: { maxLimit: 100 }
      }
    );
    expect($.type.equals.competitor).toBe(true);
    expect($.limit.lte.maxLimit).toBe(true);
  });
});
