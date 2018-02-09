const ora = require('ora');
const chalk = require('chalk');
const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile');

module.exports = class importer {

  constructor() {
    this.spinner = ora();
    this.historicalLink = 'http://coinmarketcap.com/historical/';
    this.filePath = 'data.json';
    this.initialJson = {'historical-snapshots': []};
    this.fileData = null;
    this.initFile();
  }

  initFile() {
    try {
      jsonfile.readFileSync(this.filePath);
    } catch(error) {
      this.createInitialFile();
    }
  }

  createInitialFile() {
    try {
      jsonfile.writeFileSync(this.filePath, this.initialJson);
    } catch(error) {
      console.log('Could not create file ' + this.filePath + ': ' + error);
    }
  }
  
  async loadBrowser() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
  }

  async loadData() {
    await this.loadBrowser();
    await this.loadPage(this.historicalLink);
    await this.loadSubData();
    await this.closeBrowser();
  }

  async loadPage(url) {
    this.spinner.start('Loading page ' + chalk.blue(url));

    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      this.spinner.stop();
      console.log(chalk.green('✔') + ' Loaded page ' + chalk.blue(url));
    } catch (error) {
      this.spinner.stop();
      console.error(chalk.red('✖') + ' Can\'t load the page ' + chalk.blue(url));
      console.error('Let\'s retry...');
      console.error(' ');
      await this.loadPage(url);
    }
  }

  async closeBrowser() {
    await this.browser.close();
  }

  async getDates() {
    return await this.page.evaluate(() => {
      const selector = '.row a[href^="/historical/"]';
      const allLinks = Array.from(document.querySelectorAll(selector));

      let linksWithDate = allLinks.filter((link) => {
        return /^.*\d\/$/.test(link)
      })

      let dates = linksWithDate.map(element => {
        return element.href.match(/[^/]+(?=\/$)/)[0];
      })

      return dates;
    });
  }

  isDateAlreadySaved(date) {
    let fileData = this.getFileData();

    if(!fileData) {
      return false;
    }

    var found = fileData['historical-snapshots'].some(function (item) {
      return item.date === date;
    });

    if(!found) {
      return false;
    }

    return true;
  }

  async loadSubData() {
    const dates = await this.getDates();

    console.log('Found ' + dates.length + ' dates.');
    console.log(' ');

    for(var i = 0; i < dates.length; i++) {
      let date = dates[i];

      let link = this.historicalLink + date + '/';

      if(this.isDateAlreadySaved(date)) {
        console.log(chalk.green('✔') + ' Coins for date '  + date + ' already saved');
        continue;
      }

      await this.loadPage(link);

      // load data
      let currencies = await this.getCurrencies()
        .catch(reason => console.error(reason));

      let dataToSave = {
        date: date,
        currencies: currencies
      };

      this.storeData(dataToSave);

      console.log(chalk.green('✔') + ' Imported ' + currencies.length + ' coins of date ' + date);
      console.log(' ');
    }
  }

  async getCurrencies() {
    return this.page.evaluate(() => {
      let tableRows = document.querySelectorAll('table#currencies-all tr')
      let currencies = [];

      for (var i = 0; i < tableRows.length; i++) {
        let currencySorting = tableRows[i].querySelector('td:first-of-type');
        let currencySymbol = tableRows[i].querySelector('.currency-name .currency-symbol');
        let currencyName = tableRows[i].querySelector('.currency-name .currency-name-container');
        let currencyPrice = tableRows[i].querySelector('.price');
        let currencyPercent24h = tableRows[i].querySelector('.percent-24h');
        let currencyLogo = tableRows[i].querySelector('.currency-logo-sprite');

        if(currencySorting === null) {
          continue;
        }

        currencies.push({
          'sorting': currencySorting ? currencySorting.textContent.trim() : '',
          'symbol': currencySymbol ? currencySymbol.textContent : '',
          'name': currencyName ? currencyName.textContent : '',
          'price': currencyPrice ? currencyPrice.textContent : '',
          'percent24h': currencyPercent24h !== null ? currencyPercent24h.getAttribute('data-usd') : '',
          'logo': currencyLogo !== null ? currencyLogo.getAttribute('src').replace('16x16', '128x128') : ''
        });
      }

      return currencies;
    })
  }

  storeData(data) {
    let fileData = this.getFileData();

    fileData['historical-snapshots'].push(data);

    this.writeFileData(fileData);
  }

  getFileData() {
    if(this.fileData && this.fileData.length) {
      return this.fileData;
    }

    try {
      this.fileData = jsonfile.readFileSync(this.filePath)
      return this.fileData;
    } catch(error) {
      console.log('Could not read file:', this.filePath);
      return null;
    }
  }

  writeFileData(data) {
    try {
      jsonfile.writeFileSync(this.filePath, data, {spaces: 2});
      this.fileData = data;
    } catch(error) {
      console.log('Could not write file:', this.filePath);
      this.fileData = null;
    }
  }
}