import { utils, config } from "@coolwallet/core";
import { transactionFields, keyLength } from "../config/transaction";
import * as types from '../config/types';
const ERROR_CONTAINS_EMPTY_STRING = 'The object contains empty or 0 values. First empty or 0 value encountered during encoding: ';

const getSEPath = () => {
    const path = utils.getFullPath({
        pathType: config.PathType.SLIP0010,
        pathString: "44'/283'/0'/0'/0'",
    });
    return `15${path}`;
}

const containsEmpty = (obj: any) => {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (!obj[key] || obj[key].length === 0) {
                return { containsEmpty: true, firstEmptyKey: key };
            }
        }
    }
    return { containsEmpty: false, firstEmptyKey: undefined };
}

const validTransaction = (transaction: types.Transaction) => {
    const emptyCheck = containsEmpty(transaction);
    if (emptyCheck.containsEmpty) {
        throw new Error(ERROR_CONTAINS_EMPTY_STRING + emptyCheck.firstEmptyKey);
    }
}

const arrayArguments = (length: number, values: any, valueType: any) => {
    let argument = '';
    [...Array(length)].forEach((_, i) => {
        let value = null;
        if (values && (values[i] || values[i] === 0)) value = values[i];
        let isPresent = (value || value === 0) ? '01' : '00';
        argument += isPresent;
        argument += fieldToHex(value, valueType.subType, valueType.padding);
    });
    return argument;
}

const processArray = (values: any, valueType: any) => {
    let argument = '';
    if (values) argument += arrayArguments(valueType.length, values, valueType);
    else argument += arrayArguments(valueType.length, null, valueType);
    return argument;
}

const objectArguments = (subValue: any, allValueTypes: any, key: string | number) => {
    let argument = '';
    let isPresent = subValue ? '01' : '00';
    argument += isPresent;
    // argument += fieldToHex(key, 'String', keyLength); // To be removed
    const subValueType = allValueTypes[key];
    argument += fieldToHex(subValue, subValueType.type, subValueType.padding);
    return argument;
}

const processObject = (valueObject: any, valueType: any, field: string) => {
    let argument = '';
    const allValueTypes = valueType['subFields'];
    const allSubFieldKeys = Object.keys(allValueTypes);
    if (valueObject) {
        allSubFieldKeys.forEach((key: string | number) => {
            let subValue = valueObject[key];
            argument += objectArguments(subValue, allValueTypes, key);
        });
    } else {
        allSubFieldKeys.forEach((key: string | number) => {
            argument += objectArguments(null, allValueTypes, key);
        });
    }
    return argument;
}

const fieldToHexWithPadding = (value: any, type: String, padding: number) => {
    let result = null;
    switch (type) {
        case 'Number': {
            result = Number(value).toString(16).padStart(padding, '0');
            break;
        }
        case 'String': {
            result = Buffer.from(value, 'ascii').toString('hex').padStart(padding, '0');
            break;
        }
        case 'Boolean': {
            result = value ? '01' : '00';
            break;
        }
        case 'Buffer': {
            result = value.toString('hex').padStart(padding, '0');
            break;
        }
    }
    return result;
}

const nilFieldWithPadding = (padding: number) => {
    const result = ''.padStart(padding, '0');
    return result;
}

const fieldToHex = (value: any, type: String, padding: number) => {
    return value ? fieldToHexWithPadding(value, type, padding) : nilFieldWithPadding(padding);
}

const transactionKeyArguments = (field: string, value: any, valueType: any) => {
    let argument = '';
    let isPresent = (value && value !== {}) ? '01' : '00';
    argument += isPresent;
    // argument += Buffer.from(field, 'ascii').toString('hex').padStart(keyLength, '0'); // To be removed
    return argument;
}

const transactionValueArguments = (field: string, value: any, valueType: any) => {
    let argument = '';
    switch (valueType.type) {
        case 'Array': {
            argument += processArray(value, valueType);
            break;
        }
        case 'Object': {
            argument += processObject(value, valueType, field);
            break;
        }
        default: {
            argument += fieldToHex(value, valueType.type, valueType.padding);
            break;
        }
    }
    return argument;
}

const getTransactionArgument = (transaction: types.Transaction, fields: string[]) => {
    validTransaction(transaction);
    let argument = '';
    fields.forEach((field) => {
        let value = transaction[field as keyof types.FieldType];
        const valueType = transactionFields[field as keyof types.FieldType];
        argument += transactionKeyArguments(field, value, valueType);
        argument += transactionValueArguments(field, value, valueType);
    });
    return getSEPath() + argument;
}

export {
    getSEPath,
    getTransactionArgument
};