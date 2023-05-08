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
      isSelected: customer.id === this.customerId,
      isGoldRank: customer.rank === 'gold',
      isSilverRank: customer.rank === 'silver',
      isBronzeRank: customer.rank === 'bronze',
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
          <template lwc:if={customer.isGoldRank}>
            <lightning-icon icon-name="standard:reward" size="medium"></lightning-icon>
          </template>
          <template lwc:if={customer.isSilverRank}>
            <lightning-icon icon-name="standard:promotions" size="small"></lightning-icon>
          </template>
          <template lwc:if={customer.isBronzeRank}>
            <lightning-icon icon-name="standard:customer" size="x-small"></lightning-icon>
          </template>
        </span>
        <span class="name">
          <template lwc:if={customer.isSelected}>
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

## Usage

### Declaration

To use the Directive Comparator, import the `compare` function from `c/directiveCompoarator`.
This function is supposed to use the function with a class field declaration.

```javascript
import { LightningElement } from "lwc";
import { comparator } from "c/directiveComparator";

export default class MyComponent extends LightningElement {
  prop1;
  prop2 = 123;
  // ... other field declarations ...

  // use in field declaration
  $ = comparator(this, {
    /* ... */
  });

  // ... method declarations ...
}
```

The `compare` function accepts three parameters, `context`, `contextType`, and `options`.

The `context` is the root object of the properties to compare. It is supposed to refer to the component instance, so pass `this` in the first argument.

The `contextType` is a structure definition of the properties which you want to compare in the template. Primitive properties can be expressed by `STRING_VALUE`, `NUMBER_VALUE`, or `BOOLEAN_VALUE`.
If the property is an object or an array, the definition also will nest to sub object / array.

```javascript
import { LightningElement } from "lwc";
import {
  comparator,
  NUMBER_VALUE,
  STRING_VALUE,
  BOOLEAN_VALUE,
  ANY_VALUE
} from "c/directiveComparator";

export default class MyComponent extends LightningElement {
  prop1 = 1;
  prop2 = "abc";
  prop3 = null;
  object1 = {
    foo: "FOO",
    bar: "BAR"
  };
  array1 = [];

  $ = comparator(this, {
    prop1: NUMBER_VALUE,
    prop2: STRING_VALUE,
    prop3: ANY_VALUE,
    object: {
      foo: STRING_VALUE,
      bar: STRING_VALUE
    },
    array: [
      {
        id: STRING_VALUE,
        active: BOOLEAN_VALUE
      }
    ]
  });
}
```

You can omit the `contextType` in argument. If the `contextType` is omitted, it will scan all properties defined in the class and estimate their type information.

Even if it can be omitted, the estimation runs only in initialization phase, so the estimation will not be perfect. It is recommended to pass `contextType` argument as much as possible for stable usage.

```javascript
export default class MyComponent extends LightningElement {
  prop1 = 1;
  prop2 = "abc";
  // ...

  // the comarator field declaration should come to the last in the field declarations.
  $ = comparator(this);
}
```

### Directives in Template

When you have attributes in the template to bind comparison result (for example, `lwc:if`), you can use the comparator declared in the previous step instead of directly referring the properties in the class. 

For example, if you want to check the `prop1` is greater than 1, you can write the template like this.

```html
<template>
  <div>
    <template lwc:if={$.prop1.gt.one}>
      <span>prop1 is greater than 1</span>
    </template>
  </div>
</template>
```

In above template, the part of `$.prop1` is comparator property which refers context's `prop1` property value, and the `gt` is comparison operator, and `one` is the pre-defined constant value used as operand.

If you are using iteration in template, don't warry. Directive Comparator supports that usage.

Consider that the following class defined:

```javascript
export default class MyComponent extends LightningElement {
  contactId = "c01";

  contacts = [
    { Id: "c01", Name: "John Doe" },
    { Id: "c02", Name: "Amy Taylor" }
    //...
  ];

  $ = comparator(this, {
    contactId: STRING_VALUE,
    contacts: [
      {
        Id: STRING_VALUE,
        Name: STRING_VALUE
      }
    ]
  });
}
```

Template to iterate the contacts becomes:

```html
<template>
  <ul>
    <template for:each={$.contacts} for:item="contact">
      <li key={contact.Id}>
        {contact.Name}
        <template lwc:if={contact.$.Id.equals.$contactId}>
          <strong>(*)</strong>
        </template>
      </li>
    </template>
  </ul>
</template>
```

Above template, The `$.contacts` directive is used in `for:each` attribute instead of `contacts` for iterating contact list. This iterator gives additional property `$` to each iteration item, which is a comparator object for properties of the iteration item.

In the iteration loop, the template conditionally displays information by using `lwc:if`, and the condition is described as `contact.$.Id.equals.$contactId`.  The part of `contact.$.Id` is comparator property to refer the `Id` property of `contact`. The `equals` represents equality operator. The `$contactId` refers root context property - that is, `contactId` field in the component.

### Operators

There are pre-defined operators to form comparison directive. Followings are the available operators:

* **is / equals** - Checks if given two values are exactly equal or not.

* **isNot / notEquals** - Checks if given two values are not exactly equal.

* **gt / greaterThan** - Checks if the comparing property's value is greater than the comparing value.

* **gte / greaterThanOrEquals** - Checks if the comparing property's value is greater than or equals to the comparing value.

* **lt / lessThan** - Checks if the comparing property's value is less than the comparing value.

* **lte / lessThanOrEquals** - Checks if the comparing property's value is less than or equals to the comparing value.

* **startsWith** - Checks if the comparing property's value (string) starts with the comparing string value.

* **endsWith** - Checks if the comparing property's value (string) ends with the comparing string value.

* **includes** - Checks if the comparing property's value (string) includes the comparing string value.

* **isTruthy / isFalsy** - Checks if the comparing property's value is truthy / falsy.

* **isNull / isNotNull** - Checks if the comparing property's value is null or not null.

* **isUndefined / isNotUndefined** - Checks if the comparing property's value is undefined in JavaScript or not.

* **isNullish / isNotNullish** - Checks if the comparing property's value is undefined or null in JavaScript.

* **isEmpty / isNotEmpty** - Checks if the comparing property's value is undefined, null, empty string, or empty array in JavaScript.

* **not** - Operatior that negates following comparison result. For example, `$.prop1.not.startsWith.foo` negates the comparison result from `prop1` property value and constant `foo` using operator `startsWith`.

### Constants

You might need to compare the property with constant value like 0, "foo", true, or null.
You can declare which constant values can be used in the comparision directive in the type definition.
In the property type definition you can pass the list of possible constant values in the array.

```javascript
export default class MyComponent extends LightningElement {
  type = "customer";

  $ = comparator(this, {
    type: ["customer", "partner", "competitor"],
  });
}
```

```html
<template>
  <div>
    <template lwc:if={$.type.equals.competitor}>
      <span>You are not allowed to submit the inquiry form, sorry.</span>
    </template>
  </div>
</template>
```

If you want to pass numbers or texts that has prohibited chars in lwc directive, you can pass it in name-value pair (tupple).

```javascript
export default class MyComponent extends LightningElement {
  type = "01. Customer";
  limit = 10;

  $ = comparator(this, {
    type: [
      ["customer", "01. Customer"],
      ["partner", "02. Partner"],
      ["competitor", "03. Competitor"]
    ],
    limit: [
      ["ten", 10],
      ["twenty", 20]
    ]
  });
}
```

```html
<template>
  <div>
    <template lwc:if={$.type.equals.competitor}>
      <span>You are not allowed to submit the inquiry form, sorry.</span>
    </template>
    <template lwc:if={$.limit.gt.ten}>
      <span>The specified limit exceeds the hard limit value (10).</span>
    </template>
  </div>
</template>
```

#### Global Constants

If there are constants widely used in the component properties, pass them to `constants` in `options` argument in `comparator` function.

```javascript
export default class PersonComponent extends LightningElement {
  name = "Michael Johnson";
  title = "CEO";

  $ = comparator(
    this,
    {
      name: STRING_VALUE,
      title: STRING_VALUE
    },
    {
      constants: {
        min: 1,
        max: 255
      }
    }
  );
}
```

```html
<template>
  <div class="person">
    <div class="name">
      {name}
      <template lwc:if={$.name.length.lt.min}>
        <span>Name is less than minimum length</span>
      </template>
      <template lwc:elseif={$.name.length.gt.max}>
        <span>Name exceeds maximum length</span>
      </template>
    </div>
    <div class="title">
      {title}
      <template lwc:if={$.title.length.lt.min}>
        <span>Title is less than minimum length</span>
      </template>
      <template lwc:elseif={$.title.length.gt.max}>
        <span>Title exceeds maximum length</span>
      </template>
    </div>
  </div>
</template>
```

#### Pre-defined Constants

There are pre-defined constants that can be used without declarations:

* zero
* one
* true
* false
* null
* undefined


### Context Property Reference

It is possible to reference root context properties in comparison operand, that is, the value of the fields in the component. They are referernced by $-prefixed name in the operand.

```javascript
export default class MyComponent extends LightningElement {
  selected = 2;

  fruits = [{
    id: 1,
    name: "apple"
  }, {
    id: 2,
    name: "orange"
  }, {
    id: 3,
    name: "melon"
  }, {
    id: 4,
    name: "banana"
  }];

  $ = comparator(this, {
    selected: NUMBER_VALUE,
    fruits: [{
      id: NUMBER_VALUE,
      name: STRING_VALUE
    }],
  });
}
```

```html
<template>
  <ul>
    <template for:each={$.fruits} for:item="fruit">
      <li key={fruit.id}>
        <template lwc:if={fruit.$.id.is.$selected}>
          <b>{fruit.name}</b>
        </template>
        <template lwc:else>{fruit.name} </template>
      </li>
    </template>
  </ul>
</template>
```

In the above template, the `$selected` is used in the `fruit.$.id.is` comparison, meaning that it is referencing `selected` field value in the component.