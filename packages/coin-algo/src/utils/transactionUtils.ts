import { error as ERROR } from '@coolwallet/core';
import BN from 'bn.js';
import { transactionFields } from "../config/transaction";
import * as types from '../config/types';
const ERROR_CONTAINS_EMPTY_STRING = 'The object contains empty or 0 values. First empty or 0 value encountered during encoding: ';

const containsEmpty = (obj: any) => {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (!obj[key] || obj[key].length === 0) return { containsEmpty: true, firstEmptyKey: key };
        }
    }
    return { containsEmpty: false, firstEmptyKey: undefined };
}

const validTransaction = (transaction: types.Transaction) => {
    const emptyCheck = containsEmpty(transaction);
    if (emptyCheck.containsEmpty) {
        throw new ERROR.SDKError(validTransaction.name, ERROR_CONTAINS_EMPTY_STRING + emptyCheck.firstEmptyKey);
    }
}

const arrayArguments = (length: number, values: any, valueType: any) => {
    let argument: any[] = [];
    [...Array(length)].forEach((_, i) => {
        let value = null;
        if (values && (values[i] || values[i] === 0)) value = values[i];
        argument = [...argument, processValue(value, valueType.subType)]
    });
    return argument;
}

const processArray = (values: any, valueType: any) => {
    let argument: any[] = [];
    if (values) argument = arrayArguments(valueType.length, values, valueType);
    else argument = arrayArguments(valueType.length, null, valueType);
    return argument;
}

const objectArguments = (subValue: any, allValueTypes: any, key: string | number) => {
    let argument: any[] = [];
    const subValueType = allValueTypes[key];
    argument = [processValue(subValue, subValueType.type)];
    return argument;
}

const processObject = (valueObject: any, valueType: any) => {
    let argument: any[] = [];
    const allValueTypes = valueType['subFields'];
    const allSubFieldKeys = Object.keys(allValueTypes);
    if (valueObject) {
        allSubFieldKeys.forEach((key: string | number) => {
            let subValue = valueObject[key];
            argument = [...argument, ...objectArguments(subValue, allValueTypes, key)];
        });
    } else {
        allSubFieldKeys.forEach((key: string | number) => {
            argument = [...argument, ...objectArguments(null, allValueTypes, key)];
        });
    }
    return argument;
}

const fieldToBuffer = (value: any, type: String) => {
    let result = null;
    switch (type) {
        case 'Number': {
            const valueBN = new BN(value)
            result = valueBN.toBuffer('be');
            break;
        }
        case 'String': {
            result = Buffer.from(value, 'ascii');
            break;
        }
        case 'Boolean': {
            result = value ? Buffer.from('01', 'hex') : Buffer.alloc(0);
            break;
        }
        case 'Buffer': {
            result = value;
            break;
        }
    }
    return result;
}

const processValue = (value: any, type: String) => {
    return value ? fieldToBuffer(value, type) : Buffer.alloc(0);
}

const transactionFieldPresent = (value: any, valueType: any) => {
    let argument = [];
    if (valueType.type == "Object" || valueType.type == "Array") {
        let isPresent = (value && value !== {}) ? Buffer.from('01', 'hex') : Buffer.alloc(0);
        argument.push(isPresent)
    }
    return argument;
}

const transactionValueArguments = (value: any, valueType: any) => {
    let argument = [];
    switch (valueType.type) {
        case 'Array': {
            argument = processArray(value, valueType);
            break;
        }
        case 'Object': {
            argument = processObject(value, valueType);
            break;
        }
        default: {
            argument = [processValue(value, valueType.type)];
            break;
        }
    }
    return argument;
}

const getTransactionArgument = (transaction: types.Transaction, fields: string[]) => {
    validTransaction(transaction);
    let argument: any[] = [];
    fields.forEach((field) => {
        let value = transaction[field as keyof types.FieldType];
        const valueType = transactionFields[field as keyof types.FieldType];
        argument = [...argument, ...transactionFieldPresent(value, valueType), ...transactionValueArguments(value, valueType)];
    });
    return argument;
}

export { getTransactionArgument };