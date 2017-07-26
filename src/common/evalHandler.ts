import * as t from 'babel-types';
import { NodePath } from 'babel-traverse';
import * as h from '../common/helpers';
import * as path from 'path';
import { OptionsAST, IsEval } from "./helpers";

let addRuntime = false

type Skip<T> = T & {
  skip: boolean
}

function skip<T>(t: T): Skip<T> {
  const sk = <Skip<T>>t
  sk.skip = true;
  return sk;
}

const prog = {
  enter(path: NodePath<OptionsAST<t.Program>>) {
    if(path.node.options) {
      console.error(path.node.options.no_eval)
    }
    if(path.node.options && path.node.options.no_eval) {
      path.skip()
    }
  },
  exit(path: NodePath<OptionsAST<IsEval<t.Program>>>) {
    if(path.node.options && path.node.options.no_eval) {
      path.skip()
    }
    path.node.isEval = addRuntime
  }
}

// Handle `eval` occuring in function calls.
const callExpr = {
  enter(path: NodePath<Skip<t.CallExpression>>) {
    if(path.node.skip) return;
    const { callee, arguments:args } = path.node;
    if(t.isIdentifier(callee) && callee.name === 'eval') {
      if(process) {
        process.stderr.write('// Found eval in code, requiring runtime\n')
      }
      addRuntime = true;
      path.node.arguments = args.map(e =>
        t.callExpression(t.identifier('$compile_string'), [e]))
    }
  }
}

// Handle new Function
const newExpr = {
  enter(path: NodePath<t.NewExpression>) {
    const { callee, arguments:args } = path.node;
    if(t.isIdentifier(callee) && callee.name === 'Function') {
      if(process) {
        process.stderr.write(
          '// Found `new Function` in code, requiring runtime\n')
      }
      const name = path.scope.generateUidIdentifier('evald_function')
      addRuntime = true;
      const body = path.node.arguments.pop()
        if (body !== undefined) {
        path.replaceWith(skip(t.callExpression(
          t.identifier('eval'),
          [t.callExpression(t.identifier('$compile_func'),
            [t.stringLiteral(name.name), body, t.arrayExpression(
              [...path.node.arguments])])])))
      }
    }
  }
}

const visitor = {
  Program: prog,
  CallExpression: callExpr,
  NewExpression: newExpr
}

module.exports = function() {
  return { visitor }
}
