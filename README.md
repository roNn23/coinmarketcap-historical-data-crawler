# coinmarketcap-historical-data-crawler

Command-line interface to fetch historical from coinmarketcap.com with puppeteer.

## Install

```
git clone git@github.com:roNn23/coinmarketcap-historical-data-crawler.git
cd coinmarketcap-historical-data-crawler
yarn
```

## Usage
To run the crawler, run the following command.

```
yarn start
```

After that, the data is saved in `data.json`.

## Data Structure

```
{
  "historical-snapshots": [
    {
      "date": "20130428",
      "currencies": [
        {
          "sorting": "1",
          "symbol": "BTC",
          "name": "Bitcoin",
          "price": "$135.58",
          "percent24h": "",
          "logo": "https://files.coinmarketcap.com/static/img/coins/128x128/bitcoin.png"
        },
        ...
      ]
    },
    {"date": "20130505" ...}
  ]
}
```

## License

MIT
