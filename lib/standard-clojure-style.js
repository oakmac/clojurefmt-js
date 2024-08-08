/* global define */

// standard-clojure-style v0.1.0
//
// Copyright 2023 © Chris Oakman
// ISC License

// -----------------------------------------------------------------------------
// JS Module Boilerplate

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory)
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.clojurefmt = factory()
  }
}(this, function () { // start module anonymous scope
  'use strict'

  // ---------------------------------------------------------------------------
  // Type Predicates

  function isString (s) {
    return typeof s === 'string'
  }

  function isInteger (x) {
    return typeof x === 'number' && isFinite(x) && Math.floor(x) === x
  }

  function isPositiveInt (i) {
    return isInteger(i) && i >= 0
  }

  function isFunction (f) {
    return typeof f === 'function'
  }

  function isObject (o) {
    return typeof o === 'object'
  }

  function isArray (x) {
    return Array.isArray(x)
  }

  // ---------------------------------------------------------------------------
  // Language Helpers
  // NOTE: wrapping these functions make it easier to port between languages

  // returns the length of a String
  function strLen (s) {
    return s.length
  }

  // returns the length of an Array
  function arraySize (a) {
    return a.length
  }

  // returns the last item in an Array
  // returns null if the Array has no items
  function arrayLast (a) {
    const s = arraySize(a)
    if (s === 0) {
      return null
    } else {
      return a[dec(s)]
    }
  }

  function dropLast (arr) {
    return arr.splice(0, dec(arraySize(arr)))
  }

  function strConcat (s1, s2) {
    return '' + s1 + s2
  }

  function strConcat3 (s1, s2, s3) {
    return '' + s1 + s2 + s3
  }

  function inc (n) {
    return n + 1
  }

  function dec (n) {
    return n - 1
  }

  // runs aFn(key, value) on every key/value pair inside of obj
  function objectForEach (obj, aFn) {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        aFn(prop, obj[prop])
      }
    }
  }

  function deleteObjKey (obj, key) {
    delete obj[key]
    return obj
  }

  // ---------------------------------------------------------------------------
  // Stack Operations

  // function isStackEmpty (s) {
  //   return arraySize(s) === 0
  // }

  function stackPeek (arr, idxFromBack) {
    const maxIdx = dec(arraySize(arr))
    if (idxFromBack > maxIdx) {
      return null
    }
    return arr[maxIdx - idxFromBack]
  }

  function stackPop (s) {
    const itm = s.pop()
    return itm
  }

  function stackPush (s, itm) {
    s.push(itm)
    return null
  }

  // ---------------------------------------------------------------------------
  // String Utils

  // returns the character at position n inside of String s (0-indexed)
  function charAt (s, n) {
    return s.charAt(n)
  }

  // Returns the substring of s beginning at start inclusive, and ending
  // at end (defaults to length of string), exclusive.
  function substr (s, start, end) {
    const len = strLen(s)
    if (!isPositiveInt(end)) end = len
    if (end > len) end = len
    // TODO: throw here if end < start?
    return s.substring(start, end)
  }

  function repeatString (text, n) {
    let result = ''
    let i = 0
    while (i < n) {
      result = result + text
      i = inc(i)
    }
    return result
  }

  // does String needle exist inside of String s?
  function strIncludes (s, needle) {
    return s.includes(needle)
  }

  // function toLowerCase (s) {
  //   return s.toLowerCase()
  // }

  function toUpperCase (s) {
    return s.toUpperCase()
  }

  function strJoin (arr, s) {
    return arr.join(s)
  }

  // function rtrim (s) {
  //   return s.trimEnd()
  // }

  function strTrim (s) {
    return s.trim()
  }

  function strStartsWith (s, startStr) {
    return s.startsWith(startStr)
  }

  function isNonBlankString (s) {
    return isString(s) && s !== ''
  }

  // ---------------------------------------------------------------------------
  // id generator

  let idCounter = 999

  function createId () {
    idCounter = inc(idCounter)
    return strConcat('id_', idCounter)
  }

  // ---------------------------------------------------------------------------
  // Node Types

  // creates and returns an AST Node Object:
  // - start: start position in String (inclusive)
  // - end: end position in String (exclusive)
  // - children: array of child Nodes
  // - name: name of the Node
  // - text: raw text of the Node (only for terminal nodes like Regex or Strings)
  function Node (opts) {
    return {
      start: opts.start,
      end: opts.end,
      children: opts.children,
      name: opts.name,
      text: opts.text
    }
  }

  function Named (opts) {
    return {
      parse: (txt, pos) => {
        const parser = getParser(opts.parser)
        const node = parser.parse(txt, pos)

        if (!node) {
          return null
        } else if (node && !isString(node.name)) {
          node.name = opts.name
          return node
        } else {
          return Node({
            start: node.start,
            end: node.end,
            children: [node],
            name: opts.name
          })
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Terminal Parsers

  // Terminal parser that matches any single character.
  function AnyChar (opts) {
    return {
      name: opts.name,
      parse: (txt, pos) => {
        if (pos < strLen(txt)) {
          return Node({
            start: pos,
            end: inc(pos),
            name: opts.name,
            text: charAt(txt, pos)
          })
        } else {
          return null
        }
      }
    }
  }

  // Terminal parser that matches one character.
  function Char (opts) {
    return {
      isTerminal: true,
      char: opts.char,
      name: opts.name,
      parse: function (txt, pos) {
        if (pos < strLen(txt) && charAt(txt, pos) === opts.char) {
          return Node({
            start: pos,
            end: inc(pos),
            name: opts.name,
            text: opts.char
          })
        } else {
          return null
        }
      }
    }
  }

  // Terminal parser that matches any single character, except one.
  function NotChar (opts) {
    return {
      isTerminal: true,
      char: opts.char,
      name: opts.name,
      parse: function (txt, pos) {
        if (pos < strLen(txt)) {
          const charAtThisPos = charAt(txt, pos)
          if (charAtThisPos !== opts.char) {
            return Node({
              start: pos,
              end: inc(pos),
              name: opts.name,
              text: charAtThisPos
            })
          }
        }
      }
    }
  }

  // Terminal parser that matches a String
  function String (opts) {
    return {
      name: opts.name,
      parse: (txt, pos) => {
        const len = strLen(opts.str)
        if (pos + len <= strLen(txt)) {
          const strToCompare = substr(txt, pos, pos + len)
          if (opts.str === strToCompare) {
            return Node({
              start: pos,
              end: pos + len,
              name: opts.name,
              text: opts.str
            })
          }
        }
      }
    }
  }

  // TODO: extract the regex operations here to make it easier to port
  function Regex (opts) {
    return {
      name: opts.name,
      pattern_str: opts.regex,
      parse: (txt, pos) => {
        // NOTE: this might be a perf issue; investigate later
        const txt2 = substr(txt, pos)
        const result = txt2.match(opts.regex)

        // HACK HACK HACK:
        // make sure the match was the beginning of the String
        // this can break in subtle ways: think of a better solution here
        if (result && result[0] !== '') {
          const matchedTxt = result[0]
          if (!txt2.startsWith(matchedTxt)) return null
        }

        let matchedStr = null
        if (result && isInteger(opts.groupIdx) && isString(result[inc(opts.groupIdx)])) {
          matchedStr = result[inc(opts.groupIdx)]
        } else if (result && isString(result[0])) {
          matchedStr = result[0]
        }

        if (isString(matchedStr)) {
          return Node({
            start: pos,
            end: pos + strLen(matchedStr),
            name: opts.name,
            text: matchedStr
          })
        }

        return null
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Sequence Parsers

  // parser that matches a linear sequence of other parsers
  function Seq (opts) {
    return {
      isTerminal: false,
      name: opts.name,

      parse: (txt, pos) => {
        const children = []
        let end = pos

        let j = 0
        const numParsers = arraySize(opts.parsers)
        while (j < numParsers) {
          const parser = opts.parsers[j]

          const possibleNode = parser.parse(txt, end)
          if (possibleNode) {
            appendChildren(children, possibleNode)
            end = possibleNode.end
          } else {
            // else this is not a valid sequence: early return
            return null
          }
          j = inc(j)
        }

        return Node({ start: pos, end, children, name: opts.name })
      }
    }
  }

  // matches the first matching of several parsers
  function Choice (opts) {
    return {
      parse: (txt, pos) => {
        let i = 0
        const numParsers = arraySize(opts.parsers)
        while (i < numParsers) {
          const parser = getParser(opts.parsers[i])
          const possibleNode = parser.parse(txt, pos)

          if (possibleNode) return possibleNode

          i = inc(i)
        }
        return null
      }
    }
  }

  // matches child parser zero or more times
  function Repeat (opts) {
    return {
      parse: (txt, pos) => {
        opts.parser = getParser(opts.parser)

        let minMatches = 0
        if (isPositiveInt(opts.minMatches)) {
          minMatches = opts.minMatches
        }

        const children = []
        let end = pos

        let lookForTheNextNode = true
        while (lookForTheNextNode) {
          const node = opts.parser.parse(txt, end)
          if (node) {
            appendChildren(children, node)
            end = node.end
          } else {
            lookForTheNextNode = false
          }
        }

        let name2 = null
        if (isString(opts.name) && end > pos) name2 = opts.name

        if (arraySize(children) >= minMatches) {
          return Node({
            start: pos,
            end,
            children,
            name: name2
          })
        } else {
          return null
        }
      }
    }
  }

  // Parser that either matches a child parser or skips it
  function Optional (parser) {
    return {
      parse: (txt, pos) => {
        const node = parser.parse(txt, pos)
        if (node && isString(node.text) && node.text !== '') {
          return node
        } else {
          return Node({ start: pos, end: pos })
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Parser Helpers / Rename?

  // FIXME: write this so it returns the new Array
  function appendChildren (childrenArr, node) {
    if (isString(node.name) && node.name !== '') {
      childrenArr.push(node)
    } else if (isArray(node.children)) {
      let i = 0
      const numChildren = arraySize(node.children)
      while (i < numChildren) {
        const child = node.children[i]
        if (child) appendChildren(childrenArr, child)
        i = inc(i)
      }
    }
  }

  // TODO: rename to resolveParser?
  function getParser (p) {
    if (isString(p) && parsers[p]) return parsers[p]
    if (isObject(p) && isFunction(p.parse)) return p
    console.error('Unable to getParser:', p)
    return null
  }

  // ---------------------------------------------------------------------------
  // Parser Definitions

  const parsers = {}

  parsers.string = Seq(
    {
      name: 'string',
      parsers: [
        Regex({ regex: /#?"/, name: '.open' }),
        Optional(Regex({ regex: /([^"\\]+|\\.)+/, name: '.body' })),
        Optional(Char({ char: '"', name: '.close' }))
      ]
    }
  )

  const whitespaceCommons = ' ,\\n\\r\\t\\f'
  const whitespaceUnicodes = '\\u000B\\u001C\\u001D\\u001E\\u001F\\u2028\\u2029\\u1680\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2008\\u2009\\u200a\\u205f\\u3000'
  const whitespaceChars = strConcat(whitespaceCommons, whitespaceUnicodes)

  const tokenHeadChars = '()\\[\\]{}\\"@~^;`#\\\''
  const tokenTailChars = '()\\[\\]{}\\"@^;`'

  const tokenReStr = '[^' + tokenHeadChars + whitespaceChars + '][^' + tokenTailChars + whitespaceChars + ']*'
  const charReStr = '\\\\[()\\[\\]{}"@^;`]'

  parsers.token = Regex({ name: 'token', regex: new RegExp('(##)?' + '(' + charReStr + '|' + tokenReStr + ')') })

  parsers._ws = Regex({ name: 'whitespace', regex: new RegExp('[' + whitespaceChars + ']+') })
  // parsers._ws = Choice({
  //   parsers: [
  //     String({ name: 'whitespace:newline', str: '\n' }),
  //     Regex({ name: 'whitespace', regex: new RegExp('[' + whitespaceChars + ']+') })
  //   ]
  // })

  parsers.comment = Regex({ name: 'comment', regex: /;[^\n]*/ })

  parsers.discard = Seq({
    name: 'discard',
    parsers: [
      String({ name: 'marker', str: '#_' }),
      Repeat({ parser: '_gap' }),
      Named({ name: '.body', parser: '_form' })
    ]
  })

  parsers.braces = Seq({
    name: 'braces',
    parsers: [
      // NOTE: difference from cs_parser.py here
      Choice({
        parsers: [
          Char({ name: '.open', char: '{' }),
          String({ name: '.open', str: '#{' }),
          String({ name: '.open', str: '#::{' }),
          Regex({ name: '.open', regex: /#:{1,2}[a-zA-Z][a-zA-Z0-9.-_]*{/ })
        ]
      }),
      Repeat({
        name: '.body',
        parser: Choice({ parsers: ['_gap', '_form', NotChar({ name: 'error', char: '}' })] })
      }),
      Optional(Char({ name: '.close', char: '}' }))
    ]
  })

  parsers.brackets = Seq({
    name: 'brackets',
    parsers: [
      Char({ name: '.open', char: '[' }),
      Repeat({
        name: '.body',
        parser: Choice({ parsers: ['_gap', '_form', NotChar({ name: 'error', char: ']' })] })
      }),
      Optional(Char({ name: '.close', char: ']' }))
    ]
  })

  parsers.parens = Seq({
    name: 'parens',
    parsers: [
      Regex({ name: '.open', regex: /(#\?@|#\?|#=|#)?\(/ }),
      Repeat({
        name: '.body',
        parser: Choice({ parsers: ['_gap', '_form', NotChar({ char: ')', name: 'error' })] })
      }),
      Optional(Char({ name: '.close', char: ')' }))
    ]
  })

  parsers._gap = Choice({ parsers: ['_ws', 'comment', 'discard'] })

  parsers.meta = Seq({
    name: 'meta',
    parsers: [
      Repeat({
        minMatches: 1,
        parser: Seq({
          parsers: [
            Regex({ name: '.marker', regex: /#?\^/ }),
            Repeat({ parser: '_gap' }),
            Named({ name: '.meta', parser: '_form' }),
            Repeat({ parser: '_gap' })
          ]
        })
      }),
      Named({ name: '.body', parser: '_form' })
    ]
  })

  parsers.wrap = Seq({
    name: 'wrap',
    parsers: [
      Regex({ name: '.marker', regex: /(@|'|`|~@|~|#')/ }),
      Repeat({ parser: '_gap' }),
      Named({ name: '.body', parser: '_form' })
    ]
  })

  parsers.tagged = Seq({
    name: 'tagged',
    parsers: [
      Char({ char: '#' }),
      Repeat({ parser: '_gap' }),
      Named({ name: '.tag', parser: 'token' }),
      Repeat({ parser: '_gap' }),
      Named({ name: '.body', parser: '_form' })
    ]
  })

  parsers._form = Choice({ parsers: ['token', 'string', 'parens', 'brackets', 'braces', 'wrap', 'meta', 'tagged'] })

  parsers.source = Repeat({
    name: 'source',
    parser: Choice({ parsers: ['_gap', '_form', AnyChar({ name: 'error' })] })
  })

  // ---------------------------------------------------------------------------
  // Format Helpers

  // TODO: some of this information should be calculated when parsing
  // TODO: it would be nice if every paren open / close pair had a unique id

  function nodeContainsText (node) {
    return node && isString(node.text) && node.text !== ''
  }

  function isNsNode (node) {
    return node.name === 'token' && node.text === 'ns'
  }

  function isRequireNode (node) {
    return node && isString(node.text) && (node.text === ':require' || node.text === 'require')
  }

  function isRequireMacrosKeyword (node) {
    return node && isString(node.text) && node.text === ':require-macros'
  }

  function isReferClojureNode (node) {
    return node && isString(node.text) && (node.text === ':refer-clojure' || node.text === 'refer-clojure')
  }

  function isExcludeKeyword (node) {
    return node && isString(node.text) && node.text === ':exclude'
  }

  function isOnlyKeyword (node) {
    return node && isString(node.text) && node.text === ':only'
  }

  function isRenameKeyword (node) {
    return node && isString(node.text) && node.text === ':rename'
  }

  function isAsKeyword (node) {
    return node && isString(node.text) && node.text === ':as'
  }

  function isReferKeyword (node) {
    return node && isString(node.text) && node.text === ':refer'
  }

  function isReferMacrosKeyword (node) {
    return node && isString(node.text) && node.text === ':refer-macros'
  }

  function isIncludeMacrosNode (node) {
    return node && isString(node.text) && node.text === ':include-macros'
  }

  function isBooleanNode (node) {
    return node && isString(node.text) && (node.text === 'true' || node.text === 'false')
  }

  function isAllNode (node) {
    return node && isString(node.text) && node.text === ':all'
  }

  function isKeywordNode (node) {
    return node && isString(node.text) && strStartsWith(node.text, ':')
  }

  function isImportNode (node) {
    return node && isString(node.text) && (node.text === ':import' || node.text === 'import')
  }

  function isNewlineNode (n) {
    return n && isString(n.text) && strIncludes(n.text, '\n')
  }

  function isWhitespaceNode (n) {
    return n.name === 'whitespace' || isNewlineNode(n)
  }

  function isParenOpener (n) {
    return n.text === '(' || n.text === '[' || n.text === '{' || n.text === '#{' || n.text === '#?(' || n.text === '#?@('
  }

  function isParenCloser (n) {
    return n && isString(n.text) && (n.text === ')' || n.text === ']' || n.text === '}')
  }

  function isTokenNode (n) {
    return n.name === 'token'
  }

  function isStringNode (n) {
    return n.name === 'string'
  }

  function isCommentNode (n) {
    return n.name === 'comment'
  }

  function isOneSpaceOpener (opener) {
    return opener.text === '{' || opener.text === '['
  }

  function isReaderConditionalOpener (opener) {
    return opener.text === '#?(' || opener.text === '#?@('
  }

  // recursively runs function f on every node in the tree
  function recurseAllChildren (node, f) {
    f(node)
    if (node.children) {
      const numChildren = arraySize(node.children)
      let i = 0
      while (i < numChildren) {
        const childNode = node.children[i]
        recurseAllChildren(childNode, f)
        i = inc(i)
      }
    }
    return null
  }

  // returns a flat array of the nodes to print
  function flattenTree (tree) {
    const nodes = []
    const pushNodeToNodes = (node) => {
      nodes.push(node)
    }
    recurseAllChildren(tree, pushNodeToNodes)

    return nodes
  }

  // searches forward to find the next node that has non-empty text
  // returns the node if found, null otherwise
  function findNextNodeWithText (allNodes, idx) {
    const maxIdx = arraySize(allNodes)

    while (idx < maxIdx) {
      const node = allNodes[idx]
      if (isString(node.text) && node.text !== '') {
        return node
      }
      idx = inc(idx)
    }

    return null
  }

  // searches forward in the nodes array for whitespace or closing nodes
  // stops when it finds the first non-whitespace or non-closer
  // returns an array of the closer + whitespace nodes (possibly an empty array)
  function findCloserNodes (nodes, idx) {
    const closers = []
    const nodesSize = arraySize(nodes)

    let keepSearching = true
    while (keepSearching) {
      const node = nodes[idx]

      if (!node) {
        keepSearching = false
      } else if (isWhitespaceNode(node) || isParenCloser(node)) {
        closers.push(node)
        keepSearching = true // NOTE: this is a no-op, but I like being explicit
      } else {
        keepSearching = false
      }

      idx = inc(idx)

      // stop searching if we are at the end of the nodes list
      if (idx > nodesSize) {
        keepSearching = false
      }
    }

    return closers
  }

  // returns the number of spaces to use for indentation at the beginning of a line
  function numSpacesForIndentation (wrappingOpener) {
    if (!wrappingOpener) {
      return 0
    } else {
      const nextNodeAfterOpener = wrappingOpener._nextWithText
      const openerTextLength = strLen(wrappingOpener.text)
      const directlyUnderneathOpener = wrappingOpener._colIdx + openerTextLength

      if (isReaderConditionalOpener(wrappingOpener)) {
        return directlyUnderneathOpener
        // TODO: pretty sure one or both of these conditions can be removed or combined
      } else if (nextNodeAfterOpener && isParenOpener(nextNodeAfterOpener)) {
        return inc(wrappingOpener._colIdx)
      } else if (isOneSpaceOpener(wrappingOpener)) {
        return inc(wrappingOpener._colIdx)
      } else {
        // else indent two spaces from the wrapping opener
        return inc(inc(wrappingOpener._colIdx))
      }
    }
  }

  function numSpacesAfterNewline (newlineNode) {
    // TODO: make this language neutral
    const x = newlineNode.text.split('\n')
    const lastX = arrayLast(x)
    return strLen(lastX)
  }

  // ---------------------------------------------------------------------------
  // Parse Namespace

  function compareRequiresSymbols (requireA, requireB) {
    if (requireA.symbol > requireB.symbol) return 1
    else if (requireA.symbol < requireB.symbol) return -1
    else return 0
  }

  function compareImports (importA, importB) {
    if (importA.package > importB.package) return 1
    else if (importA.package < importB.package) return -1
    else return 0
  }

  function compareFirstElement (arrA, arrB) {
    if (arrA[0] > arrB[0]) return 1
    else if (arrA[0] < arrB[0]) return -1
    else return 0
  }

  function looksLikeAJavaClassname (s) {
    const firstChar = charAt(s, 0)
    return toUpperCase(firstChar) === firstChar
  }

  function parseJavaPackageWithClass (s) {
    const chunks = s.split('.') // TODO: make language neutral
    const lastItm = arrayLast(chunks)

    if (looksLikeAJavaClassname(lastItm)) {
      const packageChunks = dropLast(chunks)
      const packageName = strJoin(packageChunks, '.')

      return {
        package: packageName,
        className: lastItm
      }
    } else {
      return {
        package: s,
        className: null
      }
    }
  }

  // returns the next token node inside a :require list / vector, starting from idx
  // returns null if we reach a closing paren
  // FIXME: this will not work with metadata, comments, or reader conditionals
  function findNextTokenInsideRequireForm (nodes, idx) {
    let result = null
    const numNodes = arraySize(nodes)

    let keepSearching = true
    while (keepSearching) {
      const node = nodes[idx]

      if (isParenCloser(node)) {
        keepSearching = false
        result = null
      } else if (isTokenNode(node) && node.text !== '') {
        keepSearching = false
        result = node
      }

      idx = inc(idx)

      if (idx >= numNodes) {
        keepSearching = false
      }
    }

    return result
  }

  // Extracts namespace information from a flat array of Nodes.
  // Returns a simple data structure of the ns form that can be used to "print from scratch"
  function parseNs (nodesArr) {
    let idx = 0
    const numNodes = arraySize(nodesArr)
    const result = {
      nsSymbol: null
    }

    let parenNestingDepth = 0
    let lineNo = 0
    const parenStack = []
    let insideNsForm = false
    let insideReferClojureForm = false
    let referClojureLineNo = -1
    let insideRequireForm = false
    let requireFormLineNo = -1
    let insideImportForm = false
    let importFormLineNo = -1
    let nextTextNodeIsNsSymbol = false
    let insideImportPackageList = false
    let collectReferClojureExcludeSymbols = false
    let collectReferClojureOnlySymbols = false
    let collectReferClojureRenameSymbols = false
    let renamesTmp = []
    let importPackageListFirstToken = null
    let nsNodeIdx = -1
    let referClojureNodeIdx = -1
    let requireNodeIdx = -1
    let referIdx = -1
    let referParenNestingDepth = -1
    let importNodeIdx = -1
    let importNodeParenNestingDepth = -1
    let activeRequireIdx = -1
    let requireSymbolIdx = -1
    let nextTokenIsAsSymbol = false
    let singleLineComments = []
    let activeImportPackageName = null
    let prevNodeIsNewline = false
    let lineOfLastCommentRecording = -1
    let insidePrefixList = false
    let prefixListPrefix = null
    let prefixListLineNo = -1
    const prefixListComments = {}
    let currentPrefixListId = null
    let insideReaderConditional = false
    let currentReaderConditionalPlatform = null
    let readerConditionalParenNestingDepth = -1
    let insideRequireList = false
    let requireListParenNestingDepth = -1
    let referMacrosIdx = -1
    let referMacrosParenNestingDepth = -1
    let includeMacrosIdx = -1
    let activeRequireMacrosIdx = -1
    let insideRequireMacrosForm = false
    let requireMacrosNodeIdx = -1
    let requireMacrosLineNo = -1
    let requireMacrosParenNestingDepth = -1
    let requireMacrosReferNodeIdx = -1
    let requireMacrosAsNodeIdx = -1
    let requireMacrosRenameIdx = -1

    while (idx < numNodes) {
      const node = nodesArr[idx]
      const currentNodeIsNewline = isNewlineNode(node)

      if (parenNestingDepth === 1 && isNsNode(node)) {
        insideNsForm = true
        nextTextNodeIsNsSymbol = true
        nsNodeIdx = idx
      } else if (insideNsForm && isReferClojureNode(node)) {
        insideReferClojureForm = true
        referClojureLineNo = lineNo
        referClojureNodeIdx = idx
      } else if (insideNsForm && isRequireNode(node)) {
        insideRequireForm = true
        requireFormLineNo = lineNo
        requireNodeIdx = idx
      } else if (insideNsForm && isImportNode(node)) {
        insideImportForm = true
        importFormLineNo = lineNo
        importNodeIdx = idx
        importNodeParenNestingDepth = parenNestingDepth
      } else if (insideNsForm && isRequireMacrosKeyword(node)) {
        insideRequireMacrosForm = true
        requireMacrosNodeIdx = idx
        requireMacrosLineNo = lineNo
        requireMacrosParenNestingDepth = parenNestingDepth
      }

      if (isParenOpener(node)) {
        parenNestingDepth = inc(parenNestingDepth)
        stackPush(parenStack, node)

        if (insideNsForm && isReaderConditionalOpener(node)) {
          insideReaderConditional = true
          currentReaderConditionalPlatform = null
          readerConditionalParenNestingDepth = parenNestingDepth
        } else if (insideRequireForm) {
          insideRequireList = true
          requireListParenNestingDepth = parenNestingDepth
        } else if (insideImportForm && parenNestingDepth > importNodeParenNestingDepth) {
          insideImportPackageList = true
        }
      } else if (isParenCloser(node)) {
        parenNestingDepth = dec(parenNestingDepth)
        stackPop(parenStack)

        // TODO: should these be "else if"s or just "ifs" ?
        // I think maybe they should be "if"s
        if (insideImportPackageList) {
          insideImportPackageList = false
          importPackageListFirstToken = null
        } else if (insideRequireForm && parenNestingDepth <= 1) {
          insideRequireForm = false
        } else if (insideRequireList && parenNestingDepth < requireListParenNestingDepth) {
          insideRequireList = false
          requireListParenNestingDepth = -1
        } else if (insideReferClojureForm && parenNestingDepth <= 1) {
          insideReferClojureForm = false
          referClojureNodeIdx = -1
        } else if (insideNsForm && parenNestingDepth === 0) {
          insideNsForm = false

          // FIXME: optimization
          // We can assume that there is only one ns per file and exit the loop early here
          // once we reach the next line
        }

        if (parenNestingDepth < 3) {
          collectReferClojureExcludeSymbols = false
          collectReferClojureOnlySymbols = false
          collectReferClojureRenameSymbols = false
        }
        if (referIdx > 0 && parenNestingDepth < referParenNestingDepth) {
          referIdx = -1
          referParenNestingDepth = -1
        }
        if (insideRequireForm && requireSymbolIdx > 0) {
          requireSymbolIdx = -1
        }
        if (insideRequireForm && insidePrefixList) {
          insidePrefixList = false
          prefixListPrefix = null
        }
        if (insideReaderConditional && parenNestingDepth === dec(readerConditionalParenNestingDepth)) {
          insideReaderConditional = false
          currentReaderConditionalPlatform = null
          readerConditionalParenNestingDepth = -1
        }
        if (idx > referMacrosIdx && parenNestingDepth <= referMacrosParenNestingDepth) {
          referMacrosIdx = -1
          referMacrosParenNestingDepth = -1
        }
        if (insideImportForm && parenNestingDepth < importNodeParenNestingDepth) {
          insideImportForm = false
          importNodeIdx = -1
          importNodeParenNestingDepth = -1
        }
        if (insideRequireMacrosForm && parenNestingDepth < requireMacrosParenNestingDepth) {
          insideRequireMacrosForm = false
          requireMacrosParenNestingDepth = -1
          requireMacrosNodeIdx = -1
          requireMacrosAsNodeIdx = -1
        }

        requireMacrosReferNodeIdx = -1
        requireMacrosRenameIdx = -1
      }

      const isTokenNode2 = isTokenNode(node)
      const isTextNode = nodeContainsText(node)

      // collect the ns symbol
      if (idx > nsNodeIdx && nextTextNodeIsNsSymbol && isTokenNode2 && isTextNode) {
        result.nsSymbol = node.text
        nextTextNodeIsNsSymbol = false

      // collect reader conditional platform keyword
      } else if (insideReaderConditional && parenNestingDepth === readerConditionalParenNestingDepth && isKeywordNode(node)) {
        currentReaderConditionalPlatform = node.text

      // collect single-line comments
      } else if (idx > nsNodeIdx && prevNodeIsNewline && isCommentNode(node)) {
        stackPush(singleLineComments, node.text)

      // collect comments at the end of a line
      } else if (idx > nsNodeIdx && !prevNodeIsNewline && isCommentNode(node)) {
        const commentAtEndOfLine = node.text

        if (prefixListLineNo === lineNo) {
          if (!prefixListComments[currentPrefixListId]) {
            prefixListComments[currentPrefixListId] = {}
          }
          prefixListComments[currentPrefixListId].commentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (requireFormLineNo === lineNo && activeRequireIdx < 0) {
          result.requireCommentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (requireFormLineNo === lineNo && activeRequireIdx >= 0) {
          result.requires[activeRequireIdx].commentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (lineNo === referClojureLineNo && result.referClojure) {
          result.referClojureCommentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (importFormLineNo === lineNo && !result.importsObj) {
          result.importCommentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (importFormLineNo === lineNo) {
          result.importsObj[activeImportPackageName].commentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        } else if (requireMacrosLineNo === lineNo) {
          result.requireMacros[activeRequireMacrosIdx].commentAfter = commentAtEndOfLine
          lineOfLastCommentRecording = lineNo
        }

        if (!insideNsForm && lineNo === lineOfLastCommentRecording) {
          result.commentOutsideNsForm = commentAtEndOfLine
        }

      // attach comments to the :require form
      } else if (insideRequireForm && idx === requireNodeIdx && arraySize(singleLineComments) > 0) {
        result.requireCommentsAbove = singleLineComments
        singleLineComments = []

      // attach comments to the :import form
      } else if (insideImportForm && idx === importNodeIdx && arraySize(singleLineComments) > 0) {
        result.importCommentsAbove = singleLineComments
        singleLineComments = []

      // attach comments to the :refer-clojure form
      } else if (insideReferClojureForm && idx === referClojureNodeIdx && arraySize(singleLineComments) > 0) {
        result.referClojureCommentsAbove = singleLineComments
        singleLineComments = []

      // collect the docstring
      } else if (idx > nsNodeIdx && parenNestingDepth >= 1 && referClojureNodeIdx < 0 && requireNodeIdx < 0 && importNodeIdx < 0 && isStringNode(node)) {
        // NOTE: this should always be true, but I like being defensive
        if (arraySize(node.children) === 3 && node.children[1].name === '.body') {
          result.docstring = node.children[1].text
        }

      // collect :refer-clojure :exclude
      } else if (insideReferClojureForm && idx > referClojureNodeIdx && isExcludeKeyword(node)) {
        if (!result.referClojure) {
          result.referClojure = {}
        }
        result.referClojure.exclude = []
        collectReferClojureExcludeSymbols = true

      // collect :refer-clojure :exclude symbols
      } else if (idx > inc(referClojureNodeIdx) && collectReferClojureExcludeSymbols && parenNestingDepth >= 3 && isTokenNode2 && isTextNode && result.referClojure && isArray(result.referClojure.exclude)) {
        stackPush(result.referClojure.exclude, node.text)

      // collect :refer-clojure :only
      } else if (insideReferClojureForm && idx > referClojureNodeIdx && isOnlyKeyword(node)) {
        if (!result.referClojure) {
          result.referClojure = {}
        }
        result.referClojure.only = []
        collectReferClojureOnlySymbols = true

      // collect :refer-clojure :only symbols
      } else if (idx > inc(referClojureNodeIdx) && collectReferClojureOnlySymbols && parenNestingDepth >= 3 && isTokenNode2 && isTextNode && result.referClojure && isArray(result.referClojure.only)) {
        stackPush(result.referClojure.only, node.text)

      // collect :refer-clojure :rename
      } else if (insideReferClojureForm && idx > referClojureNodeIdx && isRenameKeyword(node)) {
        if (!result.referClojure) {
          result.referClojure = {}
        }
        result.referClojure.rename = []
        collectReferClojureRenameSymbols = true

      // collect :refer-clojure :rename symbols
      } else if (idx > inc(referClojureNodeIdx) && collectReferClojureRenameSymbols && parenNestingDepth >= 3 && isTokenNode2 && isTextNode && result.referClojure && isArray(result.referClojure.rename)) {
        stackPush(renamesTmp, node.text)
        if (arraySize(renamesTmp) === 2) {
          stackPush(result.referClojure.rename, renamesTmp)
          renamesTmp = []
        }

      // is this :require :as ?
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isAsKeyword(node)) {
        nextTokenIsAsSymbol = true

      // collect the require :as symbol
      } else if (idx > requireNodeIdx && insideRequireForm && nextTokenIsAsSymbol && isTokenNode2 && isTextNode) {
        nextTokenIsAsSymbol = false
        result.requires[activeRequireIdx].as = node.text

      // collect :require-macros :refer symbols
      } else if (insideRequireMacrosForm && requireMacrosReferNodeIdx !== -1 && idx > requireMacrosReferNodeIdx && isTokenNode2 && isTextNode) {
        if (!isArray(result.requireMacros[activeRequireMacrosIdx].refer)) {
          result.requireMacros[activeRequireMacrosIdx].refer = []
        }
        stackPush(result.requireMacros[activeRequireMacrosIdx].refer, node.text)

      // collect :require-macros :as symbol
      } else if (insideRequireMacrosForm && requireMacrosAsNodeIdx !== -1 && idx > requireMacrosAsNodeIdx && isTokenNode2 && isTextNode) {
        result.requireMacros[activeRequireMacrosIdx].as = node.text
        requireMacrosAsNodeIdx = -1

      // collect :require-macros :rename
      } else if (insideRequireMacrosForm && requireMacrosRenameIdx !== -1 && idx > requireMacrosRenameIdx && isTokenNode2 && isTextNode) {
        if (!isArray(result.requireMacros[activeRequireMacrosIdx].rename)) {
          result.requireMacros[activeRequireMacrosIdx].rename = []
        }

        stackPush(renamesTmp, node.text)
        if (arraySize(renamesTmp) === 2) {
          stackPush(result.requireMacros[activeRequireMacrosIdx].rename, renamesTmp)
          renamesTmp = []
        }

      // :require-macros :refer
      } else if (insideRequireMacrosForm && idx > requireMacrosNodeIdx && isReferKeyword(node)) {
        requireMacrosReferNodeIdx = idx

      // :require-macros :as
      } else if (insideRequireMacrosForm && idx > requireMacrosNodeIdx && isAsKeyword(node)) {
        requireMacrosAsNodeIdx = idx

      // :require-macros :rename
      } else if (insideRequireMacrosForm && idx > requireMacrosNodeIdx && isRenameKeyword(node)) {
        requireMacrosRenameIdx = idx
        renamesTmp = []

      // collect :require-macros symbol
      } else if (insideRequireMacrosForm && idx > requireMacrosNodeIdx && isTokenNode2 && isTextNode) {
        if (!result.requireMacros) {
          result.requireMacros = []

          // add commentsAbove to the :require-macros form if possible
          if (arraySize(singleLineComments) > 0) {
            result.requireMacrosCommentsAbove = singleLineComments
            singleLineComments = []
          }
        }

        const reqObj = {
          symbol: node.text
        }

        // store the comments above this line
        if (arraySize(singleLineComments) > 0) {
          reqObj.commentsAbove = singleLineComments
          singleLineComments = []
        }

        // add reader conditional platform
        if (insideReaderConditional && currentReaderConditionalPlatform) {
          reqObj.platform = currentReaderConditionalPlatform
        }

        stackPush(result.requireMacros, reqObj)
        activeRequireMacrosIdx = inc(activeRequireMacrosIdx)
        requireMacrosLineNo = lineNo

      // is this :include-macros ?
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isIncludeMacrosNode(node)) {
        includeMacrosIdx = idx

      // collect :include-macros boolean
      } else if (idx > includeMacrosIdx && isTokenNode2 && isBooleanNode(node)) {
        if (node.text === 'true') {
          result.requires[activeRequireIdx].includeMacros = true
        } else {
          result.requires[activeRequireIdx].includeMacros = false
        }

        includeMacrosIdx = -1

      // is this :refer-macros ?
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isReferMacrosKeyword(node)) {
        referMacrosIdx = idx
        referMacrosParenNestingDepth = parenNestingDepth

      // collect :refer-macros symbols
      } else if (idx > referMacrosIdx && insideRequireForm && parenNestingDepth === inc(referMacrosParenNestingDepth) && isTokenNode2 && isTextNode) {
        if (!isArray(result.requires[activeRequireIdx].referMacros)) {
          result.requires[activeRequireIdx].referMacros = []
        }
        stackPush(result.requires[activeRequireIdx].referMacros, node.text)

      // is this :require :refer ?
      } else if (idx > requireNodeIdx && insideRequireForm && isTokenNode2 && isReferKeyword(node)) {
        referIdx = idx
        referParenNestingDepth = parenNestingDepth

      // collect :refer :all
      } else if (idx > referIdx && insideRequireForm && isTokenNode2 && isAllNode(node)) {
        result.requires[activeRequireIdx].refer = 'all'

      // collect :require :refer symbols
      } else if (idx > referIdx && insideRequireForm && parenNestingDepth === inc(referParenNestingDepth) && isTokenNode2 && isTextNode) {
        if (!isArray(result.requires[activeRequireIdx].refer)) {
          result.requires[activeRequireIdx].refer = []
        }
        stackPush(result.requires[activeRequireIdx].refer, node.text)

      // collect :require symbol not inside of a list / vector
      } else if (insideRequireForm && !insideRequireList && idx > requireNodeIdx && isTokenNode2 && isTextNode && requireSymbolIdx === -1 && !isKeywordNode(node)) {
        if (!isArray(result.requires)) {
          result.requires = []
        }

        const requireObj = {
          symbol: node.text
        }
        stackPush(result.requires, requireObj)
        activeRequireIdx = inc(activeRequireIdx)
        requireFormLineNo = lineNo

        // attach comments from the lines above this require
        if (arraySize(singleLineComments) > 0) {
          result.requires[activeRequireIdx].commentsAbove = singleLineComments
          singleLineComments = []
        }

        // add platform if we are inside a Reader Conditional
        if (insideReaderConditional && currentReaderConditionalPlatform) {
          result.requires[activeRequireIdx].platform = currentReaderConditionalPlatform
        }

      // collect symbols inside of a prefix list
      } else if (insidePrefixList && isTokenNode2 && isTextNode) {
        if (!isArray(result.requires)) {
          result.requires = []
        }

        const namespace = strConcat3(prefixListPrefix, '.', node.text)

        const requireObj = {
          prefixListId: currentPrefixListId,
          symbol: namespace
        }
        stackPush(result.requires, requireObj)
        activeRequireIdx = inc(activeRequireIdx)
        requireSymbolIdx = idx
        requireFormLineNo = lineNo
        insidePrefixList = true

      // collect :require symbol inside of a list / vector
      } else if (insideRequireForm && insideRequireList && idx > requireNodeIdx && isTokenNode2 && isTextNode && requireSymbolIdx === -1 && !isKeywordNode(node)) {
        if (!isArray(result.requires)) {
          result.requires = []
        }

        // five possibilities for a :require import:
        // - require symbol not inside of list / vector
        // - require symbol inside a list / vector, followed by nothing
        // - require symbol for a prefix list (need to examine the following symbols in order to know this)
        // - require symbol followed by :as
        // - require symbol followed by :refer

        const nextTokenInsideRequireForm = findNextTokenInsideRequireForm(nodesArr, inc(idx))
        const isPrefixList = nextTokenInsideRequireForm && !isKeywordNode(nextTokenInsideRequireForm)

        if (isPrefixList) {
          const prefixListId = createId()
          insidePrefixList = true
          prefixListLineNo = lineNo
          prefixListPrefix = node.text
          currentPrefixListId = prefixListId

          // store the comments above this line
          // we will attach them to the first ns imported by this prefix list later
          if (arraySize(singleLineComments) > 0) {
            const itm = {
              commentsAbove: singleLineComments
            }
            prefixListComments[prefixListId] = itm
            singleLineComments = []
          }
        } else {
          const requireObj = {
            symbol: node.text
          }
          stackPush(result.requires, requireObj)
          activeRequireIdx = inc(activeRequireIdx)
          requireSymbolIdx = idx
          requireFormLineNo = lineNo
          insidePrefixList = false
          prefixListLineNo = -1

          // attach comments from the lines above this require
          if (arraySize(singleLineComments) > 0) {
            result.requires[activeRequireIdx].commentsAbove = singleLineComments
            singleLineComments = []
          }

          // add platform if we are inside a Reader Conditional
          if (insideReaderConditional && currentReaderConditionalPlatform) {
            result.requires[activeRequireIdx].platform = currentReaderConditionalPlatform
          }
        }

      // collect :import packages not inside of a list or vector
      } else if (insideImportForm && idx > importNodeIdx && !insideImportPackageList && isTokenNode2 && isTextNode) {
        if (!result.importsObj) {
          result.importsObj = {}
        }

        const packageParsed = parseJavaPackageWithClass(node.text)
        const packageName = packageParsed.package
        const className = packageParsed.className

        if (!result.importsObj[packageName]) {
          result.importsObj[packageName] = {
            classes: []
          }
        }

        stackPush(result.importsObj[packageName].classes, className)
        activeImportPackageName = packageName
        importFormLineNo = lineNo

        if (arraySize(singleLineComments) > 0) {
          result.importsObj[packageName].commentsAbove = singleLineComments
          singleLineComments = []
        }

        // add platform if we are inside a Reader Conditional
        if (insideReaderConditional && currentReaderConditionalPlatform) {
          result.importsObj[packageName].platform = currentReaderConditionalPlatform
        }

      // collect :import classes inside of a list or vector
      } else if (insideImportPackageList && isTokenNode2 && isTextNode) {
        if (!importPackageListFirstToken) {
          const packageName = node.text
          importPackageListFirstToken = packageName
          activeImportPackageName = packageName
          importFormLineNo = lineNo

          if (!result.importsObj) {
            result.importsObj = {}
          }

          if (!result.importsObj[packageName]) {
            result.importsObj[packageName] = {
              classes: []
            }
          }

          if (arraySize(singleLineComments) > 0) {
            result.importsObj[packageName].commentsAbove = singleLineComments
            singleLineComments = []
          }

          // add platform if we are inside a Reader Conditional
          if (insideReaderConditional && currentReaderConditionalPlatform) {
            result.importsObj[packageName].platform = currentReaderConditionalPlatform
          }
        } else {
          stackPush(result.importsObj[importPackageListFirstToken].classes, node.text)
        }
      }

      // increment the lineNo for the next node if we are on a newline node
      // NOTE: this lineNo variable does not account for newlines inside of multi-line strings
      // but we can ignore that for the purposes of ns parsing here
      if (currentNodeIsNewline) {
        lineNo = inc(lineNo)
      }
      prevNodeIsNewline = currentNodeIsNewline

      // increment to look at the next node
      idx = inc(idx)
    }

    // sort :refer-clojure :exclude symbols
    if (result.referClojure && isArray(result.referClojure.exclude)) {
      result.referClojure.exclude.sort()
    }

    // sort :refer-clojure :only symbols
    if (result.referClojure && isArray(result.referClojure.only)) {
      result.referClojure.only.sort()
    }

    // sort :refer-clojure :rename symbols
    if (result.referClojure && isArray(result.referClojure.rename)) {
      result.referClojure.rename.sort(compareFirstElement)
    }

    // sort :require-macros symbols
    if (isArray(result.requireMacros)) {
      result.requireMacros.sort(compareRequiresSymbols)

      // sort :refer symbols
      let rmIdx = 0
      const numRequireMacrosResults = arraySize(result.requireMacros)
      while (rmIdx < numRequireMacrosResults) {
        if (isArray(result.requireMacros[rmIdx].refer)) {
          result.requireMacros[rmIdx].refer.sort()
        }
        rmIdx = inc(rmIdx)
      }
    }

    // sort the requires symbols
    if (isArray(result.requires)) {
      result.requires.sort(compareRequiresSymbols)

      const numRequires = arraySize(result.requires)
      let requiresIdx = 0
      while (requiresIdx < numRequires) {
        const req = result.requires[requiresIdx]

        // attach prefix list comments to the first require with the same id (if possible)
        if (req.prefixListId) {
          if (prefixListComments[req.prefixListId]) {
            if (prefixListComments[req.prefixListId].commentsAbove) {
              req.commentsAbove = prefixListComments[req.prefixListId].commentsAbove
            }
            if (prefixListComments[req.prefixListId].commentAfter) {
              req.commentAfter = prefixListComments[req.prefixListId].commentAfter
            }
            deleteObjKey(prefixListComments, req.prefixListId)
          }

          // delete prefixListIds from the result
          deleteObjKey(req, 'prefixListId')
        }

        // sort :require :refer symbols
        if (isArray(result.requires[requiresIdx].refer)) {
          result.requires[requiresIdx].refer.sort()
        }

        requiresIdx = inc(requiresIdx)
      }
    }

    // convert and sort the imports
    if (result.importsObj) {
      result.imports = []

      objectForEach(result.importsObj, function (packageName, obj) {
        const sortedClasses = obj.classes.sort()
        const importObj = {
          package: packageName,
          classes: sortedClasses
        }

        if (obj.commentsAbove) {
          importObj.commentsAbove = obj.commentsAbove
        }
        if (obj.commentAfter) {
          importObj.commentAfter = obj.commentAfter
        }
        if (obj.platform) {
          importObj.platform = obj.platform
        }

        stackPush(result.imports, importObj)
      })

      deleteObjKey(result, 'importsObj')

      result.imports.sort(compareImports)
    }

    return result
  }

  // ---------------------------------------------------------------------------
  // Formatter

  // returns a sorted array of platform strings found on items in arr
  function getPlatformsFromArray (arr) {
    let hasDefault = false
    const platforms = {}
    const numItms = arraySize(arr)
    let idx = 0
    while (idx < numItms) {
      const itm = arr[idx]
      if (itm.platform) {
        if (itm.platform === ':default') {
          hasDefault = true
        } else {
          platforms[itm.platform] = null
        }
      }

      idx = inc(idx)
    }

    const platformsArr = []
    objectForEach(platforms, function (platformStr, _ignore) {
      stackPush(platformsArr, platformStr)
    })

    platformsArr.sort() // FIXME: abstract to language neutral

    if (hasDefault) {
      stackPush(platformsArr, ':default')
    }

    return platformsArr
  }

  // returns true if there are only one require per platform
  // this lets us use the standard reader conditional #?( instead of
  // the splicing reader conditional #?@(
  function onlyOneRequirePerPlatform (reqs) {
    const platformCounts = {}
    const numReqs = arraySize(reqs)
    let idx = 0
    let keepSearching = true
    let result = true
    while (keepSearching) {
      if (reqs[idx] && reqs[idx].platform && isString(reqs[idx].platform)) {
        const platform = reqs[idx].platform
        if (platform !== '') {
          if (platformCounts[platform]) {
            keepSearching = false
            result = false
          } else {
            platformCounts[platform] = 1
          }
        }
      }

      idx = inc(idx)
      if (idx > numReqs) {
        keepSearching = false
      }
    }

    return result
  }

  // returns an array of require objects that are filtered on platform
  function filterOnPlatform (arr, platform) {
    const filteredReqs = []
    let idx = 0
    const numReqs = arraySize(arr)
    while (idx < numReqs) {
      const itm = arr[idx]
      if (platform === false && !itm.platform) {
        stackPush(filteredReqs, itm)
      } else if (isString(itm.platform) && itm.platform === platform) {
        stackPush(filteredReqs, arr[idx])
      }

      idx = inc(idx)
    }
    return filteredReqs
  }

  function formatRequireLine (req, initialIndentation) {
    let outTxt = ''

    if (isArray(req.commentsAbove) && arraySize(req.commentsAbove) > 0) {
      outTxt = strConcat(outTxt, initialIndentation)
      outTxt = strConcat(outTxt, strJoin(req.commentsAbove, strConcat('\n', initialIndentation)))
      outTxt = strConcat(outTxt, '\n')
    }

    outTxt = strConcat(outTxt, initialIndentation)
    outTxt = strConcat3(outTxt, '[', req.symbol)

    if (isString(req.as) && req.as !== '') {
      outTxt = strConcat3(outTxt, ' :as ', req.as)
    }

    if (isArray(req.refer) && arraySize(req.refer) > 0) {
      outTxt = strConcat(outTxt, ' :refer [')
      outTxt = strConcat(outTxt, strJoin(req.refer, ' '))
      outTxt = strConcat(outTxt, ']')
    } else if (req.refer === 'all') {
      outTxt = strConcat(outTxt, ' :refer :all')
    }

    if (req.includeMacros === true) {
      outTxt = strConcat(outTxt, ' :include-macros true')
    } else if (req.includeMacros === false) {
      outTxt = strConcat(outTxt, ' :include-macros false')
    }

    if (isArray(req.referMacros) && arraySize(req.referMacros) > 0) {
      outTxt = strConcat(outTxt, ' :refer-macros [')
      outTxt = strConcat(outTxt, strJoin(req.referMacros, ' '))
      outTxt = strConcat(outTxt, ']')
    }

    outTxt = strConcat(outTxt, ']')

    return outTxt
  }

  function formatNs (ns) {
    let outTxt = strConcat('(ns ', ns.nsSymbol)

    let numRequireMacros = 0
    if (isArray(ns.requireMacros)) {
      numRequireMacros = arraySize(ns.requireMacros)
    }

    let numRequires = 0
    if (isArray(ns.requires)) {
      numRequires = arraySize(ns.requires)
    }

    let numImports = 0
    if (isArray(ns.imports)) {
      numImports = arraySize(ns.imports)
    }

    const importsIsLastMainForm = numImports > 0
    const requireIsLastMainForm = numRequires > 0 && !importsIsLastMainForm
    const requireMacrosIsLastMainForm = numRequireMacros > 0 && numRequires === 0 && numImports === 0
    let trailingParensArePrinted = false

    if (isString(ns.docstring)) {
      outTxt = strConcat(outTxt, '\n  "')
      outTxt = strConcat(outTxt, ns.docstring)
      outTxt = strConcat(outTxt, '"')
    }

    if (ns.referClojure) {
      if (isArray(ns.referClojure.exclude) && arraySize(ns.referClojure.exclude) > 0) {
        outTxt = strConcat(outTxt, '\n  (:refer-clojure :exclude [')
        outTxt = strConcat(outTxt, strJoin(ns.referClojure.exclude, ' '))
        outTxt = strConcat(outTxt, '])')
      }

      if (isArray(ns.referClojure.only) && arraySize(ns.referClojure.only) > 0) {
        outTxt = strConcat(outTxt, '\n  (:refer-clojure :only [')
        outTxt = strConcat(outTxt, strJoin(ns.referClojure.only, ' '))
        outTxt = strConcat(outTxt, '])')
      }

      if (isArray(ns.referClojure.rename) && arraySize(ns.referClojure.rename) > 0) {
        const tmpRenames = []
        const numRenames = arraySize(ns.referClojure.rename)
        let renamesIdx = 0
        while (renamesIdx < numRenames) {
          const itm = ns.referClojure.rename[renamesIdx]
          stackPush(tmpRenames, strJoin(itm, ' '))
          renamesIdx = inc(renamesIdx)
        }

        outTxt = strConcat(outTxt, '\n  (:refer-clojure :rename {')
        outTxt = strConcat(outTxt, strJoin(tmpRenames, ', '))
        outTxt = strConcat(outTxt, '})')
      }
    }

    if (numRequireMacros > 0) {
      const cljsPlatformRequireMacros = filterOnPlatform(ns.requireMacros, ':cljs')
      const requireMacrosWrappedInReaderConditional = arraySize(cljsPlatformRequireMacros) === numRequireMacros
      let rmLastLineCommentAfter = null

      let rmIndentation = '    '
      if (requireMacrosWrappedInReaderConditional) {
        outTxt = strConcat(outTxt, '\n')
        outTxt = strConcat(outTxt, '  #?(:cljs\n')
        outTxt = strConcat(outTxt, '     (:require-macros\n')

        rmIndentation = '       '
      } else {
        outTxt = strConcat(outTxt, '\n')
        outTxt = strConcat(outTxt, '  (:require-macros\n')
      }

      let rmIdx = 0
      while (rmIdx < numRequireMacros) {
        const rm = ns.requireMacros[rmIdx]
        const isLastRequireMacroLine = inc(rmIdx) === numRequireMacros
        outTxt = strConcat(outTxt, formatRequireLine(rm, rmIndentation))

        if (isNonBlankString(rm.commentAfter)) {
          if (isLastRequireMacroLine) {
            rmLastLineCommentAfter = rm.commentAfter
          } else {
            outTxt = strConcat3(outTxt, ' ', rm.commentAfter)
          }
        }

        if (!isLastRequireMacroLine) {
          outTxt = strConcat(outTxt, '\n')
        }

        rmIdx = inc(rmIdx)
      }

      if (!requireMacrosIsLastMainForm && !requireMacrosWrappedInReaderConditional) {
        outTxt = strConcat(outTxt, ')')
      } else if (!requireMacrosIsLastMainForm && requireMacrosWrappedInReaderConditional) {
        outTxt = strConcat(outTxt, '))')
      } else if (requireMacrosIsLastMainForm && !requireMacrosWrappedInReaderConditional) {
        outTxt = strConcat(outTxt, '))')
        trailingParensArePrinted = true
      } else if (requireMacrosIsLastMainForm && requireMacrosWrappedInReaderConditional) {
        outTxt = strConcat(outTxt, '))))')
        trailingParensArePrinted = true
      }

      if (isNonBlankString(rmLastLineCommentAfter)) {
        outTxt = strConcat3(outTxt, ' ', rmLastLineCommentAfter)
      }
    }

    if (numRequires > 0) {
      let closeRequireParenTrail = ')'
      let lastRequireHasComment = false
      let lastRequireComment = null

      if (isArray(ns.requireCommentsAbove) && arraySize(ns.requireCommentsAbove) > 0) {
        outTxt = strConcat(outTxt, '\n  ')
        outTxt = strConcat(outTxt, strJoin(ns.requireCommentsAbove, '\n  '))
      }
      outTxt = strConcat(outTxt, '\n  (:require\n')

      let requiresIdx = 0
      while (requiresIdx < numRequires) {
        const req = ns.requires[requiresIdx]
        // FIXME: this no longer works correctly with reader conditionals
        const isLastRequire1 = inc(requiresIdx) === numRequires

        if (!req.platform) {
          outTxt = strConcat(outTxt, formatRequireLine(req, '    '))

          if (req.commentAfter && !isLastRequire1) {
            outTxt = strConcat(outTxt, ' ')
            outTxt = strConcat(outTxt, req.commentAfter)
            outTxt = strConcat(outTxt, '\n')
          } else if (isLastRequire1 && req.commentAfter && requireIsLastMainForm) {
            closeRequireParenTrail = strConcat(')) ', req.commentAfter)
            trailingParensArePrinted = true
          } else if (isLastRequire1 && req.commentAfter) {
            closeRequireParenTrail = strConcat(') ', req.commentAfter)
          } else if (isLastRequire1 && !req.commentAfter) {
            closeRequireParenTrail = ')'
          } else {
            outTxt = strConcat(outTxt, '\n')
          }
        }

        requiresIdx = inc(requiresIdx)
      }

      const reqPlatforms = getPlatformsFromArray(ns.requires)
      let platformIdx = 0
      const numPlatforms = arraySize(reqPlatforms)
      const requireBlockHasReaderConditionals = numPlatforms > 0
      const useStandardReaderConditional = onlyOneRequirePerPlatform(ns.requires)

      // use standard reader conditional #?(
      if (useStandardReaderConditional) {
        while (platformIdx < numPlatforms) {
          const platform = reqPlatforms[platformIdx]

          if (platformIdx === 0) {
            outTxt = strTrim(outTxt)
            outTxt = strConcat3(outTxt, '\n    #?(', platform)
            outTxt = strConcat(outTxt, ' ')
          } else {
            outTxt = strConcat(outTxt, '\n       ')
            outTxt = strConcat3(outTxt, platform, ' ')
          }

          // only look at requires for this platform
          const platformRequires = filterOnPlatform(ns.requires, platform)
          const req = platformRequires[0]
          outTxt = strConcat(outTxt, formatRequireLine(req, ''))

          // FIXME: need to add commentsBefore and commentsAfter here

          platformIdx = inc(platformIdx)
        }
      // use splicing reader conditional #?@(
      } else {
        while (platformIdx < numPlatforms) {
          const platform = reqPlatforms[platformIdx]
          const isLastPlatform = inc(platformIdx) === numPlatforms

          if (platformIdx === 0) {
            outTxt = strTrim(outTxt)
            outTxt = strConcat(outTxt, '\n    #?@(')
            outTxt = strConcat3(outTxt, platform, '\n        [')
          } else {
            outTxt = strConcat(outTxt, '\n\n        ')
            outTxt = strConcat3(outTxt, platform, '\n        [')
          }

          // only look at requires for this platform
          const platformRequires = filterOnPlatform(ns.requires, platform)
          const numFilteredReqs = arraySize(platformRequires)
          let printedFirstReqLine = false
          let printPlatformClosingBracket = true
          let reqIdx2 = 0
          while (reqIdx2 < numFilteredReqs) {
            const req = platformRequires[reqIdx2]
            const isLastRequireForThisPlatform = inc(reqIdx2) === numFilteredReqs

            if (printedFirstReqLine) {
              outTxt = strConcat(outTxt, formatRequireLine(req, '         '))
            } else {
              printedFirstReqLine = true
              outTxt = strConcat(outTxt, formatRequireLine(req, ''))
            }

            if (req.commentAfter && !isLastRequireForThisPlatform) {
              outTxt = strConcat(outTxt, ' ')
              outTxt = strConcat(outTxt, req.commentAfter)
              outTxt = strConcat(outTxt, '\n')
            } else if (req.commentAfter && isLastRequireForThisPlatform && !isLastPlatform) {
              outTxt = strConcat3(outTxt, '] ', req.commentAfter)
              printPlatformClosingBracket = false
            } else if (req.commentAfter && isLastRequireForThisPlatform && (isLastPlatform || requireIsLastMainForm)) {
              lastRequireHasComment = true
              lastRequireComment = req.commentAfter
            } else if (isLastRequireForThisPlatform && req.commentAfter) {
              closeRequireParenTrail = strConcat(') ', req.commentAfter)
            } else if (isLastRequireForThisPlatform && !req.commentAfter) {
              closeRequireParenTrail = ']'
            } else {
              outTxt = strConcat(outTxt, '\n')
            }

            reqIdx2 = inc(reqIdx2)
          }

          if (printPlatformClosingBracket) {
            outTxt = strConcat(outTxt, ']')
          }

          platformIdx = inc(platformIdx)
        }
      }

      // closeRequireParenTrail can be one of six options:
      // - )             <-- no reader conditional, no comment on the last item, not the last main form
      // - ) <comment>   <-- no reader conditional, comment on the last itm, not the last main form
      // - ))            <-- reader conditional, no comment on the last itm, not the last main form
      // - )) <comment>  <-- reader conditional, comment on last itm, not the last main form
      // - )))           <-- reader conditional, no comment on last itm, :require is last main form
      // - ))) <comment> <-- reader conditional, comment on last itm, :require is last main form
      if (!requireBlockHasReaderConditionals && !lastRequireHasComment && !requireIsLastMainForm) {
        closeRequireParenTrail = ')'
      } else if (!requireBlockHasReaderConditionals && lastRequireHasComment && !requireIsLastMainForm) {
        closeRequireParenTrail = strConcat(') ', lastRequireComment)
      } else if (requireBlockHasReaderConditionals && !lastRequireHasComment && !requireIsLastMainForm) {
        closeRequireParenTrail = '))'
      } else if (requireBlockHasReaderConditionals && lastRequireHasComment && !requireIsLastMainForm) {
        closeRequireParenTrail = strConcat(')) ', lastRequireComment)
      } else if (requireBlockHasReaderConditionals && !lastRequireHasComment && requireIsLastMainForm) {
        closeRequireParenTrail = ')))'
        trailingParensArePrinted = true
      } else if (requireBlockHasReaderConditionals && lastRequireHasComment && requireIsLastMainForm) {
        closeRequireParenTrail = strConcat('))) ', lastRequireComment)
        trailingParensArePrinted = true
      }

      outTxt = strTrim(outTxt)
      outTxt = strConcat(outTxt, closeRequireParenTrail)
    } // end :require printing

    if (numImports > 0) {
      // collect imports that are platform-specific (or not)
      const nonPlatformSpecificImports = filterOnPlatform(ns.imports, false)
      const numNonPlatformSpecificImports = arraySize(nonPlatformSpecificImports)
      const importPlatforms = getPlatformsFromArray(ns.imports)
      const numImportPlatforms = arraySize(importPlatforms)

      let lastImportLineCommentAfter = null
      let isImportKeywordPrinted = false

      let importsIdx = 0
      while (importsIdx < numNonPlatformSpecificImports) {
        if (!isImportKeywordPrinted) {
          outTxt = strConcat(outTxt, '\n  (:import\n')
          isImportKeywordPrinted = true
        }

        const imp = nonPlatformSpecificImports[importsIdx]
        const isLastImport = inc(importsIdx) === numNonPlatformSpecificImports

        outTxt = strConcat3(outTxt, '    (', imp.package)

        const numClasses = arraySize(imp.classes)
        let classNameIdx = 0
        while (classNameIdx < numClasses) {
          const className = imp.classes[classNameIdx]
          outTxt = strConcat3(outTxt, ' ', className)

          classNameIdx = inc(classNameIdx)
        }

        outTxt = strConcat(outTxt, ')')

        if (isNonBlankString(imp.commentAfter)) {
          outTxt = strConcat3(outTxt, ' ', imp.commentAfter)
        }

        if (!isLastImport) {
          outTxt = strConcat(outTxt, '\n')
        }

        importsIdx = inc(importsIdx)
      }

      let platformIdx = 0
      let isFirstPlatform = true
      const importSectionHasReaderConditionals = numImportPlatforms > 0
      const placeReaderConditionalOutsideOfImport = numImportPlatforms === 1 && numNonPlatformSpecificImports === 0

      while (platformIdx < numImportPlatforms) {
        const platformStr = importPlatforms[platformIdx]

        if (placeReaderConditionalOutsideOfImport) {
          outTxt = strConcat(outTxt, '\n  #?(')
          outTxt = strConcat(outTxt, platformStr)
          outTxt = strConcat(outTxt, '\n')
          outTxt = strConcat(outTxt, '     (:import\n')
          outTxt = strConcat(outTxt, '       ')
          isImportKeywordPrinted = true
        } else if (isFirstPlatform) {
          outTxt = strConcat3(outTxt, '\n    #?@(', platformStr)
          outTxt = strConcat(outTxt, '\n        [')
          isFirstPlatform = false
        } else {
          outTxt = strConcat3(outTxt, '\n\n        ', platformStr)
          outTxt = strConcat(outTxt, '\n        [')
        }

        const importsForThisPlatform = filterOnPlatform(ns.imports, platformStr)
        let idx2 = 0
        const numImports2 = arraySize(importsForThisPlatform)
        while (idx2 < numImports2) {
          const imp = importsForThisPlatform[idx2]
          const isLastImport2 = inc(idx2) === numImports2

          outTxt = strConcat(outTxt, '(')
          outTxt = strConcat(outTxt, imp.package)
          outTxt = strConcat(outTxt, ' ')
          outTxt = strConcat(outTxt, strJoin(imp.classes, ' '))
          outTxt = strConcat(outTxt, ')')

          if (isLastImport2) {
            if (!placeReaderConditionalOutsideOfImport) {
              outTxt = strConcat(outTxt, ']')
            }
            if (isNonBlankString(imp.commentAfter)) {
              lastImportLineCommentAfter = imp.commentAfter
            }
          } else {
            if (isNonBlankString(imp.commentAfter)) {
              outTxt = strConcat3(outTxt, ' ', imp.commentAfter)
            }
            if (placeReaderConditionalOutsideOfImport) {
              outTxt = strConcat(outTxt, '\n       ')
            } else {
              outTxt = strConcat(outTxt, '\n         ')
            }
          }

          idx2 = inc(idx2)
        }

        platformIdx = inc(platformIdx)
      }

      let closeImportParenTrail = ')'
      if (importsIsLastMainForm && importSectionHasReaderConditionals) {
        closeImportParenTrail = ')))'
        trailingParensArePrinted = true
      } else if (importsIsLastMainForm && !importSectionHasReaderConditionals) {
        closeImportParenTrail = '))'
        trailingParensArePrinted = true
      }

      outTxt = strConcat(outTxt, closeImportParenTrail)

      if (isNonBlankString(lastImportLineCommentAfter)) {
        outTxt = strConcat3(outTxt, ' ', lastImportLineCommentAfter)
      }
    } // end :import section

    if (!trailingParensArePrinted) {
      outTxt = strConcat(outTxt, ')')
    }

    return outTxt
  }

  // Parses inputTxt (Clojure code) and returns a String of it formatted according
  // to Standard Clojure Style.
  function format (inputTxt) {
    const tree = parse(inputTxt)
    // TODO: check for errors, return code if found

    const nodesArr = flattenTree(tree)
    const parsedNs = parseNs(nodesArr)
    const numNodes = arraySize(nodesArr)

    let parenNestingDepth = 0

    let idx = 0
    let outTxt = ''
    let outputTxtContainsChars = false
    let lineIdx = 0
    let insideNsForm = false
    let lineIdxOfClosingNsForm = -1
    let nsStartStringIdx = -1
    let nsEndStringIdx = -1

    const parenStack = []

    let colIdx = 0
    while (idx < numNodes) {
      // let prevNode = null
      // if (i > 0) { prevNode = nodesArr[dec(i)] }
      const node = nodesArr[idx]

      if (parenNestingDepth === 1 && isNsNode(node)) {
        insideNsForm = true
        nsStartStringIdx = outTxt.length
      }

      const nextTextNode = findNextNodeWithText(nodesArr, inc(idx))
      const isLastNode = inc(idx) >= numNodes

      const currentNodeIsWhitespace = isWhitespaceNode(node)
      const currentNodeIsNewline = isNewlineNode(node)
      let skipPrintingThisNode = false

      if (isParenOpener(node)) {
        parenNestingDepth = inc(parenNestingDepth)

        // TODO: rename this
        const nodeWithExtraInfo = node
        nodeWithExtraInfo._colIdx = colIdx
        nodeWithExtraInfo._nextWithText = nextTextNode
        nodeWithExtraInfo._parenOpenerLineIdx = lineIdx
        // an array of tokens on the first line of this parenStack
        // used to determine if Rule 3 indentation applies
        nodeWithExtraInfo._openingLineTokens = []
        nodeWithExtraInfo._rule3Active = false
        nodeWithExtraInfo._rule3NumSpaces = 0

        stackPush(parenStack, nodeWithExtraInfo)

        // remove whitespace after an opener (remove-surrounding-whitespace?)
        if (isWhitespaceNode(nextTextNode)) {
          // FIXME: skip this via index instead of modifying the tree like this
          nextTextNode.text = ''
        }
      } else if (isParenCloser(node)) {
        parenNestingDepth = dec(parenNestingDepth)
        stackPop(parenStack)

        if (insideNsForm && parenNestingDepth === 0) {
          insideNsForm = false
          nsEndStringIdx = strLen(outTxt)
          lineIdxOfClosingNsForm = lineIdx
        }
      }

      // add token nodes to the top of the parenStack if we are on the opening line
      const topOfTheParenStack = stackPeek(parenStack, 0)
      if (topOfTheParenStack && isTokenNode(node)) {
        const onOpeningLineOfParenStack = lineIdx === topOfTheParenStack._parenOpenerLineIdx
        if (onOpeningLineOfParenStack) {
          node._colIdx = colIdx
          node._lineIdx = lineIdx
          topOfTheParenStack._openingLineTokens.push(node)
        }
      }

      // remove whitespace before a closer (remove-surrounding-whitespace?)
      if (currentNodeIsWhitespace && !isNewlineNode(node) && isParenCloser(nextTextNode)) {
        skipPrintingThisNode = true
      }

      // do not print any initial whitespace nodes
      if (currentNodeIsWhitespace && !outputTxtContainsChars) {
        skipPrintingThisNode = true
      }

      if (currentNodeIsNewline) {
        // look forward to see if we can close parens on this line
        // FIXME: we can skip this search ahead if the parenNestingDepth is 0
        const parenTrailClosers = findCloserNodes(nodesArr, inc(idx))

        // print the closers at the end of this line if applicable
        let closersIdx = 0
        const numClosers = arraySize(parenTrailClosers)
        while (closersIdx < numClosers) {
          const closerNode = parenTrailClosers[closersIdx]
          // apply the closer nodes to the output string
          if (isParenCloser(closerNode)) {
            outTxt = strConcat(outTxt, closerNode.text)
            parenNestingDepth = dec(parenNestingDepth)
            stackPop(parenStack)
          }
          closersIdx = inc(closersIdx)

          // increase the outer loop index as well (ie: skipping forward nodes)
          idx = inc(idx)
        }

        const isDoubleNewline = strIncludes(node.text, '\n\n')
        let newlineStr = '\n'
        if (isDoubleNewline) newlineStr = '\n\n'

        // print the newline and then the next line's indentation level
        if (outputTxtContainsChars && !isLastNode) {
          const topOfTheParenStack = stackPeek(parenStack, 0)
          const numSpacesOnNextLine = numSpacesAfterNewline(node)

          // are we inside of a parenStack that crosses into the next line?
          if (topOfTheParenStack && topOfTheParenStack._parenOpenerLineIdx === lineIdx) {
            // NOTE: we start this index at 1 in order to skip the first token on the paren opener line
            // ie: we want to look at tokens 2 or later for Rule 3 alignment
            let openingLineTokensIdx = 1
            const numOpeningLineTokens = arraySize(topOfTheParenStack._openingLineTokens)
            while (openingLineTokensIdx < numOpeningLineTokens) {
              const openingLineToken = topOfTheParenStack._openingLineTokens[openingLineTokensIdx]
              if (openingLineToken._colIdx === numSpacesOnNextLine) {
                // the first token on this line is vertically aligned with a first-line token:
                // Rule 3 is activated 👍
                topOfTheParenStack._rule3Active = true
                topOfTheParenStack._rule3NumSpaces = numSpacesOnNextLine

                // we can exit the loop now
                openingLineTokensIdx = inc(numOpeningLineTokens)
              }

              openingLineTokensIdx = inc(openingLineTokensIdx)
            }
          }

          let numSpaces = 0
          if (topOfTheParenStack && topOfTheParenStack._rule3Active) {
            numSpaces = topOfTheParenStack._rule3NumSpaces
          } else {
            numSpaces = numSpacesForIndentation(topOfTheParenStack)
          }

          const indentationStr = repeatString(' ', numSpaces)
          outTxt = strConcat3(outTxt, newlineStr, indentationStr)

          // reset the colIdx
          colIdx = strLen(indentationStr)

          // increment the lineIdx
          lineIdx = inc(lineIdx)
          if (isDoubleNewline) {
            lineIdx = inc(lineIdx)
          }
        }
      } else if (nodeContainsText(node)) {
        const isTokenFollowedByOpener = isTokenNode(node) && nextTextNode && isParenOpener(nextTextNode)
        const isParenCloserFollowedByText = isParenCloser(node) && nextTextNode && (isTokenNode(nextTextNode) || isParenOpener(nextTextNode))
        const addSpaceAfterThisNode = isTokenFollowedByOpener || isParenCloserFollowedByText

        // if there is a whitespace node as the first or last node, do not print it
        if (currentNodeIsWhitespace && (isLastNode || !outputTxtContainsChars)) {
          skipPrintingThisNode = true

        // do not print a comment node on the last line of the ns form
        // (this is handled by the nsFormat function)
        } else if (isCommentNode(node) && parsedNs.commentOutsideNsForm === node.text && lineIdx === lineIdxOfClosingNsForm) {
          skipPrintingThisNode = true
        } else if (currentNodeIsWhitespace && lineIdx === lineIdxOfClosingNsForm) {
          skipPrintingThisNode = true
        }

        // add the text of this node to the output String
        if (!skipPrintingThisNode) {
          outTxt = strConcat(outTxt, node.text)
          if (outTxt !== '') {
            outputTxtContainsChars = true
          }
        }

        if (addSpaceAfterThisNode) {
          outTxt = strConcat(outTxt, ' ')
        }

        // update the colIdx
        colIdx = colIdx + strLen(node.text)
      }

      idx = inc(idx)
    }

    // replace the ns form with our formatted version
    if (nsStartStringIdx > 0) {
      const headStr = substr(outTxt, 0, dec(nsStartStringIdx))
      const nsStr = formatNs(parsedNs)

      let tailStr = ''
      if (nsEndStringIdx > 0) {
        tailStr = substr(outTxt, inc(nsEndStringIdx), -1)
      }

      outTxt = strConcat3(headStr, nsStr, tailStr)
    }

    // remove any leading or trailing whitespace
    outTxt = strTrim(outTxt)

    return {
      status: 'success',
      out: outTxt
    }
  }

  // ---------------------------------------------------------------------------
  // Public API

  // parses inputTxt and returns an tree structure of the code
  function parse (inputTxt) {
    return getParser('source').parse(inputTxt, 0)
  }

  const API = {
    format,
    parse
  }

  // dev flag: toggle this in order to test the internal functions
  const exportInternalFnsForTesting = true

  if (exportInternalFnsForTesting) {
    API._charAt = charAt
    API._substr = substr

    API._AnyChar = AnyChar
    API._Char = Char
    API._Choice = Choice
    API._Regex = Regex
    API._Repeat = Repeat
    API._Seq = Seq

    API._flattenTree = flattenTree
    API._parseJavaPackageWithClass = parseJavaPackageWithClass
    API._parseNs = parseNs
  }

  return API
})) // end module anonymous scope
