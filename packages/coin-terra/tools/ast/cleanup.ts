import { PluginObj } from '@babel/core';

const MSG_EXPORTS_NAME = 'Msg_exports';
const TX_EXPORTS_NAME = 'Tx_exports';

function Cleanup(): PluginObj {
  // Only remain fromData()
  const unusedFunctionRegex = new RegExp(/(?=(to)(Amino|Data)|(Amino))/);
  return {
    name: 'clean-up',
    visitor: {
      // Cleanup var Msg_exports = {}, var Tx_exports = {}
      VariableDeclaration(path) {
        const {
          node: { kind },
        } = path;
        if (kind === 'var') {
          const { declarations } = path.node;
          if (declarations.length === 1) {
            const [{ id }] = declarations;
            if (id.type === 'Identifier') {
              const { name } = id;
              if (name === MSG_EXPORTS_NAME || name === TX_EXPORTS_NAME) path.remove();
            }
          }
        }
      },
      // Cleanup __export(Msg_exports), module.exports = toCommonJS(Msg_exports), fromAmino(), toAmino(), toData()
      ExpressionStatement(path) {
        const {
          node: { expression },
        } = path;

        if (
          expression.type === 'CallExpression' &&
          expression.callee.type === 'Identifier' &&
          expression.callee.name === '__export'
        ) {
          path.remove();
        } else if (expression.type === 'AssignmentExpression' && expression.left.type === 'MemberExpression') {
          const memberExpression = expression.left;
          if (
            memberExpression.object.type === 'Identifier' &&
            memberExpression.object.name === 'module' &&
            memberExpression.property.type === 'Identifier' &&
            memberExpression.property.name === 'exports'
          ) {
            if (expression.right.type !== 'CallExpression') return;
            const { callee } = expression.right;
            if (callee.type === 'Identifier' && callee.name === '__toCommonJS') path.remove();
          } else if (
            memberExpression.property.type === 'Identifier' &&
            unusedFunctionRegex.test(memberExpression.property.name)
          )
            path.remove();
        }
      },
      // Cleanup all toData, toAmino, fromAmino
      ClassMethod(path) {
        const {
          node: { key },
        } = path;
        if (key.type === 'Identifier' && unusedFunctionRegex.test(key.name)) {
          path.remove();
        }
      },
      FunctionDeclaration(path) {
        const {
          node: {
            id: { name },
          },
        } = path;
        if (unusedFunctionRegex.test(name)) path.remove();
      },
    },
  };
}

export default Cleanup;
