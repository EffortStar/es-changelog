import {
  parseVersion,
  parseEntry,
  parseCategory,
  parsePr,
  normalizeBullets,
} from "../src/parser";
import test from "tape";
import { Category } from "../src/types";

test("parseVersion", (t) => {
  t.equal(parseVersion("<!-- es-changelog-version 1 -->"), 1);
  t.equal(parseVersion("<!-- es-changelog-version 69 -->"), 69);
  t.equal(parseVersion("<!-- es-changelog-version -->"), null);
  t.end();
});

test("parseCategory", (t) => {
  t.deepEqual(parseCategory("# 😅 Some name"), {
    emoji: "😅",
    title: "Some name",
    children: [],
  });
  t.deepEqual(parseCategory("##### No emoji"), {
    emoji: "",
    title: "No emoji",
    children: [],
  });
  t.end();
});

test("parseEntry", (t) => {
  t.deepEqual(parseEntry("       No bullet"), [
    { description: "No bullet", mentions: [], children: [] },
    0,
  ]);
  t.deepEqual(parseEntry("- Some description"), [
    { description: "Some description", mentions: [], children: [] },
    0,
  ]);
  t.deepEqual(parseEntry(" - Oops"), [
    { description: "Oops", mentions: [], children: [] },
    0,
  ]);
  t.deepEqual(parseEntry("  - Blah"), [
    { description: "Blah", mentions: [], children: [] },
    1,
  ]);
  t.deepEqual(parseEntry("  - Blah    [Foo, Bar]"), [
    { description: "Blah", mentions: ["Foo", "Bar"], children: [] },
    1,
  ]);
  t.end();
});

function testParsePr(
  inputDescription: string,
  pr: string,
  result: readonly Readonly<Category>[],
) {
  test(`parsePr with ${inputDescription}`, (t) => {
    t.deepEqual(parsePr(pr), result);
    t.end();
  });
}

testParsePr(
  "empty template",
  `
<!-- es-changelog-version 1 -->

## Changelog
<!--
- Add changelog entries beneath their relevant category.
- One entry per line.
- Bullet points are optional.
- Credit discord reporter(s) for each change.
  - Add usernames (not display names) for each user.
  - Make sure to check the linear issue and its Discord backlink.
- Categories can be deleted.
- Non-player-facing changes do not require a changelog. i.e. tooling, refactors.

e.g.

### 🗺️ Level Generation
Added a black hole that immediately ends the game. [johnny_gamer]

### 🖼️ Art
- Added bright red lipstick to Marcia.
- Fix an issue where cows heads were always facing backwards. [marcia, urtar_the_big_bear]

-->

### 🦋 Progression
### 🗺️ Level Generation
### 🖼️ Art
### ✅ UI
### 🏓 Gameplay
### 🔊 Audio
### 📚 Tutorialization
### 🤖 Tech

## Notes
<!-- Any notes about the change here (for posterity) -->

## Review instructions
<!-- Have you tested this? Would you like it to be tested or reviewed? If so is there anything in particular that should be looked at? -->

## Closes
<!--
List any Linear issues to be closed on merge.

e.g.

Closes EFF-1234
Closes EFF-420
-->
`,
  [],
);

testParsePr(
  "example from template",
  `
<!-- es-changelog-version 1 -->

## Changelog

### 🗺️ Level Generation
Added a black hole that immediately ends the game. [johnny_gamer]

### 🖼️ Art
- Added bright red lipstick to Marcia.
- Fix an issue where cows heads were always facing backwards. [marcia, urtar_the_big_bear]

## Something else
`,
  [
    {
      emoji: "🗺️",
      title: "Level Generation",
      children: [
        {
          description: "Added a black hole that immediately ends the game.",
          mentions: ["johnny_gamer"],
          children: [],
        },
      ],
    },
    {
      emoji: "🖼️",
      title: "Art",
      children: [
        {
          description: "Added bright red lipstick to Marcia.",
          mentions: [],
          children: [],
        },
        {
          description:
            "Fix an issue where cows heads were always facing backwards.",
          mentions: ["marcia", "urtar_the_big_bear"],
          children: [],
        },
      ],
    },
  ],
);

testParsePr(
  "nested entries",
  `
<!-- es-changelog-version 1 -->

## Changelog

### 😈️ Category Name
- Did some things
  - Foo
    - Bar [mr_man]
- Another
- And
  - Floop
`,
  [
    {
      emoji: "😈️",
      title: "Category Name",
      children: [
        {
          description: "Did some things",
          mentions: [],
          children: [
            {
              description: "Foo",
              mentions: [],
              children: [
                {
                  description: "Bar",
                  mentions: ["mr_man"],
                  children: [],
                },
              ],
            },
          ],
        },
        {
          description: "Another",
          mentions: [],
          children: [],
        },
        {
          description: "And",
          mentions: [],
          children: [
            {
              description: "Floop",
              mentions: [],
              children: [],
            },
          ],
        },
      ],
    },
  ],
);

testParsePr(
  "wrapped multiline entries",
  `
<!-- es-changelog-version 1 -->

## Changelog

### 😈️ Category Name
- This is a long
entry that is wrapped over multiple lines
  - And a nested one
    that is also multiline [foo]
`,
  [
    {
      emoji: "😈️",
      title: "Category Name",
      children: [
        {
          description:
            "This is a long entry that is wrapped over multiple lines",
          mentions: [],
          children: [
            {
              description: "And a nested one that is also multiline",
              mentions: ["foo"],
              children: [],
            },
          ],
        },
      ],
    },
  ],
);

testParsePr(
  "leading comments",
  `Some stuff here
And here
<!-- es-changelog-version 1 -->

## Changelog

### 😈️ Category Name
- Entry
`,
  [
    {
      emoji: "😈️",
      title: "Category Name",
      children: [
        {
          description:
            "Entry",
          mentions: [],
          children: [],
        },
      ],
    },
  ],
);

function testNormalizeBullets(
  testName: string,
  input: string,
  expected: readonly string[],
) {
  test(`normalizeBullets with ${testName}`, (t) => {
    t.deepEqual(normalizeBullets(input.split("\n")), expected);
    t.end();
  });
}

testNormalizeBullets(
  "Template example",
  `
### 🗺️ Level Generation
Added a black hole that immediately ends the game. [johnny_gamer]

### 🖼️ Art
- Added bright red lipstick to Marcia.
- Fix an issue where cows heads were always facing backwards. [marcia, urtar_the_big_bear]
`,
  [
    "### 🗺️ Level Generation",
    "Added a black hole that immediately ends the game. [johnny_gamer]",
    "### 🖼️ Art",
    "- Added bright red lipstick to Marcia.",
    "- Fix an issue where cows heads were always facing backwards. [marcia, urtar_the_big_bear]",
  ],
);

testNormalizeBullets(
  "Nested entries",
  `
### Category 1
- Hello
there

### Category 2
- This is a single entry
  - This one is split
  and nested
    - Even
deeper [foo]


- Another entry
### Category 3
Hello


  `,
  [
    "### Category 1",
    "- Hello there",
    "### Category 2",
    "- This is a single entry",
    "  - This one is split and nested",
    "    - Even deeper [foo]",
    "- Another entry",
    "### Category 3",
    "Hello",
  ],
);
