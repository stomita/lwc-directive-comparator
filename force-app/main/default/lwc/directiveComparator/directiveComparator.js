/**
 *
 */
export const STRING_VALUE = Symbol("STRING_VALUE");

export const NUMBER_VALUE = Symbol("NUMBER_VALUE");

export const BOOLEAN_VALUE = Symbol("BOOLEAN_VALUE");

export const ANY_VALUE = Symbol("ANY_VALUE");

const VALUE_SYMBOLS = new Set([
  STRING_VALUE,
  NUMBER_VALUE,
  BOOLEAN_VALUE,
  ANY_VALUE
]);

/**
 *
 */
const BINARY_COMPARISON_OPERATIONS = {
  equals: (v1, v2) => v1 === v2,
  is: (v1, v2) => v1 === v2,
  notEquals: (v1, v2) => v1 !== v2,
  isNot: (v1, v2) => v1 !== v2,
  greaterThan: (v1, v2) => v1 > v2,
  gt: (v1, v2) => v1 > v2,
  greaterThanOrEqual: (v1, v2) => v1 >= v2,
  gte: (v1, v2) => v1 >= v2,
  lessThan: (v1, v2) => v1 < v2,
  lt: (v1, v2) => v1 < v2,
  lessThanOrEqual: (v1, v2) => v1 <= v2,
  lte: (v1, v2) => v1 <= v2,
  startsWith: (v1, v2) => typeof v1 === "string" && v1.startsWith(v2),
  endsWith: (v1, v2) => typeof v1 === "string" && v1.endsWith(v2),
  includes: (v1, v2) => typeof v1 === "string" && v1.includes(v2)
};

const NEGATABLE_BINARY_OPERATIONS = new Set([
  "equals",
  "greaterThan",
  "gt",
  "greaterThanOrEqual",
  "gte",
  "lessThan",
  "lt",
  "lessThanOrEqual",
  "lte",
  "startsWith",
  "endsWith",
  "includes"
]);

const UNARY_COMPARISON_OPERATIONS = {
  isTruthy: (v) => !!v,
  isFalsy: (v) => !v,
  isNull: (v) => v === null,
  isNotNull: (v) => v !== null,
  isUndefined: (v) => typeof v === "undefined",
  isNotUndefined: (v) => typeof v !== "undefined",
  isNullish: (v) => v == null,
  isNotNullish: (v) => v != null,
  isEmpty: (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0),
  isNotEmpty: (v) =>
    v != null && v !== "" && (!Array.isArray(v) || v.length > 0)
};

/**
 *
 */
const DEFAULT_COMPARISON_CONSTANTS = {
  zero: 0,
  one: 1,
  true: true,
  false: false,
  null: null,
  undefined: undefined
};

function isObjectTypeDefinition(typeDef) {
  return (
    typeof typeDef === "object" && typeDef !== null && !Array.isArray(typeDef)
  );
}

function isArrayTypeDefinition(typeDef) {
  return (
    Array.isArray(typeDef) &&
    (typeDef.length === 0 ||
      (typeDef.length === 1 && isObjectTypeDefinition(typeDef[0])))
  );
}

function estimateTypeDef(value) {
  if (value == null) {
    return ANY_VALUE;
  }
  if (Array.isArray(value)) {
    const v = value[0];
    return [v != null ? estimateTypeDef(v) : ANY_VALUE];
  }
  const vtype = typeof value;
  switch (vtype) {
    case "object": {
      const objType = {};
      // eslint-disable-next-line guard-for-in
      for (const property in value) {
        try {
          const v = value[property];
          if (typeof v !== "function") {
            objType[property] = estimateTypeDef(v);
          }
        } catch (e) {
          console.error(e);
        }
      }
      return objType;
    }
    case "string":
      return STRING_VALUE;
    case "number":
      return NUMBER_VALUE;
    case "boolean":
      return BOOLEAN_VALUE;
    default:
      return ANY_VALUE;
  }
}

/**
 *
 */
function toArray(value) {
  if (value == null) {
    return value;
  }
  if (typeof value === 'object' && typeof value[Symbol.iterator] === "function") {
    return Array.from(value);
  }
  return [value];
}

function toNameValuePairs(values) {
  const nameValuePairs = [];
  for (const val of values) {
    if (typeof val === "object" && val != null) {
      for (const [name, value] of Object.entries(val)) {
        nameValuePairs.push([name, value]);
      }
    } else {
      const [name, value] = toArray(val);
      nameValuePairs.push([name, value ?? name]);
    }
  }
  return nameValuePairs;
}

/**
 *
 */
function createMemo(getKeyValue) {
  let lastKeyValue;
  let memoResult;
  return (fn) => {
    const currKeyValue = getKeyValue();
    if (lastKeyValue == null || currKeyValue !== lastKeyValue) {
      memoResult = fn(currKeyValue);
      lastKeyValue = currKeyValue;
    }
    return memoResult;
  };
}

/**
 *
 */
function createComparator(context, contextType, options = {}) {
  console.log("createComparator", options.contextPath);
  const comp = {
    get $value() {
      return context;
    }
  };
  const estimatedContextType = options.estimateProps
    ? estimateTypeDef(context)
    : ANY_VALUE;
  contextType = contextType === ANY_VALUE ? estimatedContextType : contextType;
  if (isObjectTypeDefinition(contextType)) {
    const propTypes = {
      ...estimatedContextType,
      ...contextType
    };
    definePropertyComparators(comp, context, propTypes, options);
  }
  if (contextType === STRING_VALUE) {
    definePropertyComparators(comp, context, { length: NUMBER_VALUE }, options);
  }
  defineBinaryComparisonOperations(comp, contextType, options);
  defineUnaryComparisonOperations(comp, options);
  return comp;
}

/**
 *
 */
function createIteratorComparator(items, itemType, options) {
  console.log("createIteratorComparator", options.contextPath);
  const comp = createComparator(
    items,
    { length: NUMBER_VALUE },
    { ...options, estimateProps: false }
  );
  const iterItems = toArray(items)?.map((item, index) => {
    const itemOptions = {
      ...options,
      contextProperty: `${index}`,
      contextPath: `${options.contextPath}[${index}]`,
      estimateProps: true
    };
    return {
      ...item,
      [options.comparatorNamespace]: createComparator(
        item,
        itemType,
        itemOptions
      )
    };
  });
  comp[Symbol.iterator] = () => {
    let index = 0;
    return {
      next() {
        const done = index >= (iterItems?.length ?? 0);
        const value = done ? undefined : iterItems?.[index++];
        return { done, value };
      }
    };
  };
  return comp;
}

/**
 *
 */
function createComparisonOperand(satisfies, valueDef, options) {
  const valueDefs = toArray(valueDef ?? []);
  const additionalValues = valueDefs.filter(
    (value) => !VALUE_SYMBOLS.has(value)
  );
  const nameValuePairs = toNameValuePairs([
    ...additionalValues,
    ...toArray(options.constants ?? []),
    DEFAULT_COMPARISON_CONSTANTS
  ]);
  const vals = {};
  for (const [name, value] of nameValuePairs) {
    if (name in vals) {
      continue;
    }
    Object.defineProperty(vals, name, {
      get() {
        return satisfies(value, name);
      }
    });
  }
  const { rootContext, rootContextType, rootOptions } = options;
  defineContextOperandValues(vals, satisfies, rootContext, rootContextType, {
    ...rootOptions,
    propertyPrefix: "$"
  });
  return vals;
}

/**
 *
 */
function definePropertyComparators(obj, context, propTypes, options) {
  for (const [property, propType] of Object.entries(propTypes)) {
    if (property in obj) {
      continue;
    }
    const propOptions = {
      ...options,
      contextProperty: `${property}`,
      contextPath: `${options.contextPath}.${property}`,
      estimateProps: true
    };
    const memo = createMemo(() => context?.[property]);
    let createPropertyComparator;
    if (isArrayTypeDefinition(propType)) {
      const itemType = propType?.[0] ?? ANY_VALUE;
      createPropertyComparator = (value) =>
        createIteratorComparator(value, itemType, propOptions);
    } else {
      createPropertyComparator = (value) =>
        createComparator(value, propType, propOptions);
    }
    Object.defineProperty(obj, property, {
      get() {
        return memo(createPropertyComparator);
      }
    });
  }
}

/**
 *
 */
function defineBinaryComparisonOperations(comp, valueDef, options) {
  const notOpr = {};
  for (const [operation, compareValue] of Object.entries(
    BINARY_COMPARISON_OPERATIONS
  )) {
    if (operation in comp) {
      continue;
    }
    const createChecker =
      (compare, { operationPath }) =>
      (rvalue, rpath) => {
        const lvalue = comp.$value;
        const ret = compare(lvalue, rvalue);
        console.log(
          `compare: ${options.contextPath}.${operationPath}.${rpath} => ${ret}`,
          ", left = ",
          lvalue,
          ", right = ",
          rvalue
        );
        return ret;
      };
    const satisfies = createChecker(compareValue, { operationPath: operation });
    comp[operation] = createComparisonOperand(satisfies, valueDef, options);
    if (NEGATABLE_BINARY_OPERATIONS.has(operation)) {
      const notSatisfies = createChecker((v1, v2) => !compareValue(v1, v2), {
        operationPath: `not.${operation}`
      });
      notOpr[operation] = createComparisonOperand(
        notSatisfies,
        valueDef,
        options
      );
    }
  }
  comp.not = notOpr;
}

/**
 *
 */
function defineUnaryComparisonOperations(comp, options) {
  for (const [operation, compare] of Object.entries(
    UNARY_COMPARISON_OPERATIONS
  )) {
    if (operation in comp) {
      continue;
    }
    Object.defineProperty(comp, operation, {
      get() {
        const value = comp.$value;
        const ret = compare(value);
        console.log(
          `compare: ${options.contextPath}.${operation} => ${ret}`,
          ", value = ",
          value
        );
        return ret;
      }
    });
  }
}

/**
 *
 */
function defineContextOperandValues(
  operand,
  satisfies,
  context,
  contextType,
  options
) {
  const getContext = typeof context === "function" ? context : () => context;
  const estimatedContextType = options.estimateProps
    ? estimateTypeDef(getContext())
    : {};
  contextType =
    contextType == null || contextType === ANY_VALUE
      ? estimatedContextType
      : contextType;
  const objType = {
    ...estimatedContextType,
    ...contextType
  };
  for (const [property, propType] of Object.entries(objType)) {
    const prefixedProperty = `${options.propertyPrefix ?? ""}${property}`;
    const propOptions = {
      ...options,
      estimateProps: true,
      propertyPrefix: ""
    };
    if (isObjectTypeDefinition(propType)) {
      const objOperand = {};
      defineContextOperandValues(
        objOperand,
        satisfies,
        () => getContext()?.[property],
        propType,
        propOptions
      );
      operand[prefixedProperty] = objOperand;
    } else if (isArrayTypeDefinition(propType)) {
      // TODO
    } else {
      const propertyPath = options.contextPath
        ? `${options.contextPath}.${prefixedProperty}`
        : prefixedProperty;
      Object.defineProperty(operand, prefixedProperty, {
        get() {
          const value = getContext()?.[property];
          return satisfies(value, propertyPath);
        }
      });
    }
  }
}

/**
 *
 */
export function comparator(context, contextType = {}, options = {}) {
  const contextProperty = options.contextProperty ?? "$";
  const contextPath = options.contextPath ?? "$";
  const comparatorNamespace = options.comparatorNamespace ?? "$";
  const estimateProps = options.estimateProps ?? false;
  options = {
    ...options,
    rootOptions: options,
    rootContext: context,
    rootContextType: contextType,
    contextProperty,
    contextPath,
    comparatorNamespace,
    estimateProps
  };
  return createComparator(context, contextType, options);
}
