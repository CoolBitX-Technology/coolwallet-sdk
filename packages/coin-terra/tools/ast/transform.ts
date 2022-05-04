import { PluginObj } from '@babel/core';
import * as t from '@babel/types';

const MSG_EXPORTS_NAME = 'Msg_exports';

const EXCLUDE_MSG = ['MsgClientImpl'];

function Transform(): PluginObj {
  const remainIdentifiers = new Set([
    'Tx',
    'TxBody',
    'SignDoc',
    'SimplePublicKey',
    'AuthInfo',
    'SignerInfo',
    'SignerInfo',
    'ModeInfo',
    'Fee',
    'Coin',
  ]);
  return {
    name: 'terra-transform',
    visitor: {
      Program: {
        exit(path) {
          // var Msg_exports = {};
          const msg_exports = t.identifier(MSG_EXPORTS_NAME);
          const emptyObjectExpression = t.objectExpression([]);
          const declarator = t.variableDeclarator(msg_exports, emptyObjectExpression);
          const declaration = t.variableDeclaration('var', [declarator]);
          path.pushContainer('body', declaration);
          // __export(Msg_exports, { Msg: () => Msg });
          const __exports = t.identifier('__export');
          const properties = [];
          for (const identifier of remainIdentifiers) {
            const identifierNode = t.identifier(identifier);
            const arrowFunctionExpression = t.arrowFunctionExpression([], identifierNode);
            const property = t.objectProperty(identifierNode, arrowFunctionExpression);
            properties.push(property);
          }
          const exportObjectExpression = t.objectExpression(properties);
          const callExpression = t.callExpression(__exports, [msg_exports, exportObjectExpression]);
          path.pushContainer('body', t.expressionStatement(callExpression));
          // module.exports = __toCommonJS(Msg_exports);
          const leftAssignment = t.memberExpression(t.identifier('module'), t.identifier('exports'));
          const rightAssignment = t.callExpression(t.identifier('__toCommonJS'), [msg_exports]);
          const assignmentExpression = t.assignmentExpression('=', leftAssignment, rightAssignment);
          path.pushContainer('body', t.expressionStatement(assignmentExpression));
        },
      },
      VariableDeclaration(path) {
        // Find Msg which should be exported.
        const {
          node: { kind },
        } = path;
        if (kind === 'var') {
          const { declarations } = path.node;
          if (declarations.length === 1) {
            const [{ id }] = declarations;
            if (id.type === 'Identifier' && id.name.startsWith('Msg') && !EXCLUDE_MSG.includes(id.name)) {
              remainIdentifiers.add(id.name);
            }
          }
        }
      },
    },
  };
}

export default Transform;
