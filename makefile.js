#!/usr/bin/env node
// @ts-check

import {mkdir, readFile, writeFile} from "node:fs/promises"
import {createWriteStream, existsSync} from "node:fs"
import {basename, extname, join} from "node:path"
import {argv} from "node:process"
import {finished} from "node:stream/promises"
import {Readable} from "node:stream"
import {URL, fileURLToPath} from "node:url"
import sade from "sade"
import {parse} from "yaml"

/**
 * @typedef {Object} Config
 * @property {ConfigSource} source
 */

/**
 * @typedef {Object} ConfigSource
 * @property {string} owner
 * @property {string} name
 * @property {string} branch
 * @property {string} file
 */

/** @type {Config} */
const config = {
  source: {
    owner: "onlyoffice",
    name: "docspace-hosted-solutions-declarations",
    branch: "src",
    file: "hosted-solutions.yml"
  }
}

main()

/**
 * @returns {void}
 */
function main() {
  sade("./makefile.js")
    .command("build")
    .action(build)
    .parse(argv)
}

/**
 * @returns {Promise<void>}
 */
async function build() {
  const rd = rootDir()
  const dd = distDir(rd)
  if (!existsSync(dd)) {
    await mkdir(dd)
  }

  const su = sourceFile(config.source)
  const yf = join(dd, config.source.file)
  await downloadFile(su, yf)

  const se = extname(yf)
  const sb = basename(yf, se)
  const jf = join(dd, `${sb}.json`)

  const sc = await readFile(yf, "utf-8")
  const yo = parse(sc)
  const jo = JSON.stringify(yo, null, 2)
  await writeFile(jf, jo, "utf-8")
}

/**
 * @returns {string}
 */
function rootDir() {
  const u = new URL(".", import.meta.url)
  return fileURLToPath(u)
}

/**
 * @param {string} d
 * @returns {string}
 */
function distDir(d) {
  return join(d, "dist")
}

/**
 * @param {ConfigSource} c
 * @returns {string}
 */
function sourceFile(c) {
  return `https://raw.githubusercontent.com/${c.owner}/${c.name}/${c.branch}/${c.file}`
}

/**
 * @param {string} u
 * @param {string} p
 * @returns {Promise<void>}
 */
async function downloadFile(u, p) {
  const res = await fetch(u)
  if (res.body === null) {
    throw new Error("No body")
  }
  // Uses two distinct types of ReadableStream: one from the DOM API and another
  // from NodeJS API. It functions well, so no need to worry.
  // @ts-ignore
  const r = Readable.fromWeb(res.body)
  const s = createWriteStream(p)
  const w = r.pipe(s)
  await finished(w)
}
