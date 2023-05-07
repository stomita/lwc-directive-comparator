# Directive Comparator for Lightning Web Components

Directive Comparator for Lightning Web Components is an utility that allows property comparison in the template HTML directive. 
It removes ugly getters from your class files, and keeps the template files to be self-descriptive.

## Current Problem

If you have property `rank` and `fullName` in your component, and want to show special message when the `rank` value is something special, you can do it in Aura as follows:

```html
<aura:component>
  <div>
    <aura:if isTrue="{!v.rank == 'gold'}">
      <span>Hi, {!v.fullName} - special offer to you, click <a href="">here</a>.</span>
    </aura:if>
    <aura:if isTrue="{!v.rank == 'silver'}">
      <span>Hi, {!v.fullName}, thanks for visiting again !</span>
    </aura:if>
    <aura:if isTrue="{!v.rank == 'bronze'}">
      <span>Welcome, {!v.fullName}</span>
    </aura:if>
  </div>
</aura>
```

Unlike Aura component, LWC does not allow the inline expression in template, so comparisons should be written in the script file.
You have to move the property comparison expression to the getter function of the component class.

```javascript
import { LightningElement } from 'lwc';

export default class MyComponent1 extends LightningElement {
  rank;
  
  fullName;

  get isGoldRank() {
    return this.rank === 'gold';
  }
  
  get isSilverRank() {
    return this.rank === 'gold';
  }

  get isBronzeRank() {
    return this.rank === 'bronze';
  }
}
```

```html
<template>
  <div>
    <template lwc:if={isGoldRank}>
      <span>Hi, {fullName} - special offer to you, click <a href="">here</a>.</span>
    </template>
    <template lwc:if={isSilverRank}>
      <span>Hi, {fullName}, thanks for visiting again !</span>
    </template>
    <template lwc:if={isBronzeRank}>
      <span>Welcome, {fullName}</span>
    </template>
  </div>
</template>
```

It is very daunting when it comes to comparing within an array loop.
The array must be converted to include the comparison results for each item.

```javascript
import { LightningElement } from 'lwc';

export default class MyComponent2 extends LightningElement {
  customerId = 1;
  
  customers_ = [
    { id: 1, fullName: 'John Doe', rank: 'gold' },
    { id: 2, fullName: 'Amy Taylor', rank: 'silver' },
    { id: 3, fullName: 'Michael Jones', rank: 'bronze' },  
    { id: 4, fullName: 'Jane Doe', rank: 'silver' },  
  ];

  get customers() {
    return this.customers_.map((customer) => ({
      ...customer,
      selected: customer.id === this.customerId,
      isGold: customer.rank === 'gold',
      isSilver: customer.rank === 'silver',
      isBronze: customer.rank === 'bronze',
    });
  }
}
```

```html
<template>
  <div>
    <template for:each={customers} for:item="customer">
      <div class="customer-info" key={customer.id}>
        <span class="icon">
          <template lwc:if={isGold}>
            <lightning-icon icon-name="standard:reward" size="medium"></lightning-icon>
          </template>
          <template lwc:if={isSilver}>
            <lightning-icon icon-name="standard:promotions" size="small"></lightning-icon>
          </template>
          <template lwc:if={isBronze}>
            <lightning-icon icon-name="standard:customer" size="x-small"></lightning-icon>
          </template>
        </span>
        <span class="name">
          <template lwc:if={customer.selected}>
            <strong>** {customer.fullName} **</strong>
          </template>
          <template lwc:else>
            <span>{customer.fullName}</span>
          </template>
        </span>
      </div>
    </template>
  </div>
</template>
```

This is due to the philosophy of Lightning Web Components that the logic should be separated from the template, but this tends to make components less prospective.

## Solution: Directive Comparator

Directive Comparator for Lightning Web Components solves the above concerns.

Remove getters, just add a property to the class, with an initial (and invariant) value generated by the `comparator` function.

```javascript
import { LightningElement } from "lwc";
import { comparator } from "c/directiveComparator";

export default class DirectiveComparatorSimpleExample extends LightningElement {
  rank;

  fullName;

  $ = comparator(this, {
    rank: ["gold", "silver", "bronze"]
  });
}
```

The template markup goes like this. Note that it does not have any getters in the class.

```html
<template>
  <div>
    <template lwc:if={$.rank.is.gold}>
      <span>Hi, {fullName} - special offer to you, click <a href="">here</a>.</span>
    </template>
    <template lwc:if={$.rank.is.silver}>
      <span>Hi, {fullName}, thanks for visiting again !</span>
    </template>
    <template lwc:if={$.rank.is.bronze}>
      <span>Welcome, {fullName}</span>
    </template>
  </div>
</template>
```

You can do the comparison in iterations, too.
Each iteration element has a comparator property to form a comparison expression.

```javascript
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
```

```html
<template>
  <div>
    <template for:each={$.customers} for:item="customer">
      <div class="customer-info" key={customer.id}>
        <span class="icon">
          <template lwc:if={customer.$.rank.equals.gold}>
            <lightning-icon
              icon-name="standard:reward"
              size="medium"
            ></lightning-icon>
          </template>
          <template lwc:if={customer.$.rank.equals.silver}>
            <lightning-icon
              icon-name="standard:promotions"
              size="small"
            ></lightning-icon>
          </template>
          <template lwc:if={customer.$.rank.equals.bronze}>
            <lightning-icon
              icon-name="standard:customer"
              size="x-small"
            ></lightning-icon>
          </template>
        </span>
        <span class="name">
          <template lwc:if={customer.$.id.equals.$customerId}>
            <strong>** {customer.fullName} **</strong>
          </template>
          <template lwc:else>
            <span>{customer.fullName}</span>
          </template>
        </span>
      </div>
    </template>
  </div>
</template>
```
