#! /usr/bin/env node
const Importer = require('./app/importer.js');

let importer = new Importer();

importer.loadData();