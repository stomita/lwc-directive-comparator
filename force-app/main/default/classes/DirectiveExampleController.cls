public with sharing class DirectiveExampleController {
  @AuraEnabled(cacheable=true)
  public static Contact[] getContacts(String keyword) {
    Contact[] contacts = [
      SELECT Id, Name, Email, Phone, Title
      FROM Contact
      WHERE Name LIKE :('%' + keyword + '%')
      WITH SECURITY_ENFORCED
      LIMIT 10
    ];
    return contacts;
  }
}
