/**
 * NOTE(arjun): This module has almost certainly bit-rotted.
 *
 * `func` compile mode should be used when function bodies need to be compiled
 * while preserving the function signatures. This is currently being used in
 * the pyret compiler.
 *
 * This passes around information to make sure that:
 * - the function signature is preserved
 * - globals are not redeclared (since the input function might capture variables)
 */

import * as babel from '@babel/core';
import * as t from '@babel/types';
import * as callcc from 'stopify-continuations-compiler';
import * as stopifyCallCC from './stopifyCallCC';
import * as assert from 'assert';
import { NodePath, Visitor } from '@babel/traverse';
import * as normalizeJs from '@stopify/normalize-js';
export { RV_SENTINAL, EXN_SENTINAL, knownBuiltIns } from 'stopify-continuations-compiler';

const visitor: Visitor<{ opts: callcc.CompilerOpts }> = {
  Program: {
    enter(path: NodePath<t.Program>, { opts }) {
      path.stop();
      assert.equal(path.node.body.length, 1);
      const func = path.node.body[0];
      if (func.type !== 'FunctionDeclaration') {
        throw new Error('Must compile a top-level function');
      }

      else {
        // If compile a string to be eval'd, convert last statement to a return
        // statement
        // if (opts.eval) {
        //   const lastStatement = (<t.FunctionDeclaration>func).body.body.pop()!;

        //   if (lastStatement.type === 'ExpressionStatement') {
        //     func.body.body.push(t.returnStatement(lastStatement.expression));
        //   }
        //   else {
        //     func.body.body.push(lastStatement);
        //   }
        // }

      }

      normalizeJs.traverse(path, stopifyCallCC.visitor, { opts: opts });
    }
  }
};

const defaultOpts: callcc.CompilerOpts = {
    getters: false,
    compileFunction: true,
    debug: false,
    captureMethod: 'lazy',
    newMethod: 'wrapper',
    es: 'sane',
    hofs: 'builtin',
    jsArgs: 'simple',
    requireRuntime: false,
    onDone: t.functionExpression(t.identifier('onDone'), [], t.blockStatement([])),
    sourceMap: { getLine: (x, y) => null },
    eval2: false,
    compileMode: 'normal'
};

export function compileFunction(
  code: string,
  opts: callcc.CompilerOpts = defaultOpts): string {
  const babelOpts = {
    plugins: [[() => ({ visitor }), opts]],
    babelrc: false
  };
  const { code:transformed } = babel.transformSync(code, babelOpts)!;
  if (!transformed) {
    throw new Error("Failed to transform function");
  }
  return transformed;
}
