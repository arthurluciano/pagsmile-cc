# Create Card Payment

## **Create Card Payment**

## Payin by CreditCard

<mark style="color:green;">`POST`</mark> `https://gateway-test.pagsmile.com/trade/pay`

This endpoint allows you to create a card payment.

#### Headers

| Name                                            | Type   | Description                                 |
| ----------------------------------------------- | ------ | ------------------------------------------- |
| Content-Type<mark style="color:red;">\*</mark>  | string | application/json; chartset=UTF-8            |
| Authorization<mark style="color:red;">\*</mark> | string | Basic Base($app\_*id:$security\_\*&#x6B;ey) |

#### Request Body

| Name                                             | Type   | Description                                                                                                                                                                                                    |
| ------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| app_id<mark style="color:red;">\*</mark>         | string | <p>created app's id at dashboard</p><p>- Max. 32 chars -</p>                                                                                                                                                   |
| method<mark style="color:red;">\*</mark>         | string | CreditCard or DiscoverCard                                                                                                                                                                                     |
| out_trade_no<mark style="color:red;">\*</mark>   | string | <p>ID given by the merchant in their system<br>- Max. 64 chars - </p>                                                                                                                                          |
| notify_url<mark style="color:red;">\*</mark>     | string | Where Pagsmile will send notification to                                                                                                                                                                       |
| return_url                                       | string | Redirect to Merchant's url when user finished checkout                                                                                                                                                         |
| timestamp<mark style="color:red;">\*</mark>      | string | <p>yyyy-MM-dd HH:mm:ss<br>- Max. 19 chars -</p>                                                                                                                                                                |
| subject<mark style="color:red;">\*</mark>        | string | <p>payment reason or item title</p><p>- Max. 128 chars -</p>                                                                                                                                                   |
| content<mark style="color:red;">\*</mark>        | string | <p>payment reason detail or item detail. This will be shown on the bank bill.</p><p>- Max. 255 chars -</p>                                                                                                     |
| order_amount<mark style="color:red;">\*</mark>   | string | <p>payment amount<br>- check <a href="../data/payment-method">here</a> -</p>                                                                                                                                   |
| order_currency<mark style="color:red;">\*</mark> | string | BRL, HKD, JPY, USD, EUR or GBP                                                                                                                                                                                 |
| buyer_id<mark style="color:red;">\*</mark>       | string | merchant user's id                                                                                                                                                                                             |
| token<mark style="color:red;">\*</mark>          | string | Get token by using [Tokenization API](https://docs.pagsmile.com/payin/pci-direct-integration/tokenize) or [Pagsmile Javascript](https://docs.pagsmile.com/payin/tools/pagsmile-javascript)                     |
| user_ip<mark style="color:red;">\*</mark>        | string | user's IP address                                                                                                                                                                                              |
| customer.name                                    | string | User's name                                                                                                                                                                                                    |
| customer.email                                   | string | User's email                                                                                                                                                                                                   |
| customer.phone                                   | string | User's phone                                                                                                                                                                                                   |
| customer.identify.type                           | string | <p>User's identification type</p><p>- CPF or CNPJ -</p>                                                                                                                                                        |
| customer.identify.number                         | string | <p>User's identification number</p><p>- 11 digits if CPF or 14 digits if CNPJ -</p>                                                                                                                            |
| issuer                                           | string | issuer of CreditCard                                                                                                                                                                                           |
| device.user_agent                                | string | user's browser ua                                                                                                                                                                                              |
| website_url                                      | string | <p>merchant website URL</p><p>- Max. 128 chars -</p>                                                                                                                                                           |
| address.zip_code                                 | string | zip code                                                                                                                                                                                                       |
| address.street                                   | string | <p>street</p><p>- Required if zip_code not provide -</p>                                                                                                                                                       |
| address.street_number                            | string | <p>street number</p><p>- Required if zip_code not provide -</p>                                                                                                                                                |
| address.city                                     | string | <p>city</p><p>- Required if zip_code not provide -</p>                                                                                                                                                         |
| address.state                                    | string | <p>state<br>- Required if zip_code not provide -</p>                                                                                                                                                           |
| installments                                     | string | installments for CreditCard                                                                                                                                                                                    |
| threeds.server_trans_id                          | string | Universally unique transaction identifier assigned by the 3DS Server to identify a single transaction generated by the Init 3DS API and used to link the init call to the order call                           |
| threeds.version                                  | string | Version used in the transaction                                                                                                                                                                                |
| threeds.cavv                                     | string | Authentication Value (CAVV / AAV for 3DS1) recieved from authorization/Authentication response                                                                                                                 |
| threeds.status_code                              | string | 3DSecure - Status code recieved from authorization/authentication response, (Possible values: U, N, Y, A, C, D, R, I)                                                                                          |
| threeds.eci                                      | string | ECI value recieved from authorization/authentication response                                                                                                                                                  |
| threeds.status                                   | string | 3DSecure - Status text received from 3D secure vendor                                                                                                                                                          |
| threeds.status_reason_code                       | string | String EMVCO Indicator of the reason for the 3DS status code provided during the authentication, (Possible values: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16)                             |
| threeds.liability_shift                          | string | liability shift - indicate whether the chargeback liability shifted to the card issuer                                                                                                                         |
| threeds.acs_trans_id                             | string | This field contains a universally unique transaction identifier assigned by the ACS to identify a single transaction.                                                                                          |
| threeds.ds_trans_id                              | string | A universally unique transaction identifier is assigned by the DS to identify a single transaction.                                                                                                            |
| timeout_express                                  | string | <p>m(minutes), h(hours), d(days), c(always end in current day). </p><p>Used to control the expiration time of <strong>submitting</strong> an order (from initial to processing). (90m in default, max 15d)</p> |
| region                                           | string | region of the payment. The format is ISO 3166-1 alpha-3 - ARG, BRA, etc. Check [here](https://docs.pagsmile.com/payin/data/country-code). Required if using Global app -                                       |

{% tabs %}
{% tab title="200 submit successfully" %}

```
{
    "code": "10000",
    "msg": "Success",
    "trade_no": "2022010110293900084",
    "out_trade_no": "202201010354003",
    "web_url": "",
    "trade_status": "PROCESSING"
    "pay_url": "https://checkout-test.pagsmile.com/checkout?prepay_id=", //Only available when method=DiscoverCard
    "check_url": "https://checkout-test.pagsmile.com/checkout?prepay_id="
```

{% endtab %}

{% tab title="400 duplicate out\_trade\_no" %}

```
{
    "code": "40002",
    "msg": "Business Failed",
    "sub_code": "duplicate-out_trade_no",
    "sub_msg": "out_trade_no is duplicate"
}
```

{% endtab %}
{% endtabs %}

{% hint style="info" %}
The merchant should have 3DS provider to get the value of "threeds".
{% endhint %}

### Example

```
curl --location --request POST 'https://gateway-test.pagsmile.com/trade/pay' \
--header 'Authorization: Basic MTYyNTgyOTIxNDUzMTY2Mzg6UGFnc21pbGVfc2tfZDUwMWQ1ZGNkNTI5OGQ5N2MwNmUzYjI4YjA2OWZjZmY3NDU5ZjY2NzNiMjFjMTFlYTY3NDM5MDgzOTZkOTYxNQ==' \
--header 'Content-Type: application/json' \
--data-raw '{
    * "app_id": "162************38",
    * "out_trade_no": "202201010354003",
    * "method": "CreditCard",
    * "order_amount": "12.01",
    * "order_currency": "BRL",
    * "subject": "trade pay test",
    * "content": "trade pay test content",
    * "notify_url": "http://merchant/callback/success",
      "return_url": "https://www.merchant.com",
    * "buyer_id": "buyer_0101_0001",
    * "user_ip": "127.0.0.1",
    * "token": "${token}",
      "installments": "1",
    * "timestamp": "2022-01-01 03:54:01",
      "timeout_express": "1c",
      "customer": {
          "identify": {
              "type": "CPF",
              "number": "50284414727"
          },
          "name": "Test User Name",
          "email": "test@pagsmile.com",
          "phone": "75991435892"
      },
      "device": {
          "user_agent": ""
      },
      "address": {
          "zip_code": "38082365",
      },
      "threeds": { //The "threeds" parameters are required to apply 3DS.
          "version": "2.1.0",
          "cavv": "MTIzNDU2Nzg5MDEyMzQ1Njc4OTA",
          "eci ": "05",
          "server_trans_id": "1111-2222-3333-4444",
          "acs_trans_id": "7777-8797-4645-1233",
          "ds_trans_id": "7777-8797-4645-1233",
          "status": "Cardholder authenticated",
          "status_code": "Y",
          "status_reason_code": "15",
          "liability_shift": "true"
      },
      "region": "BRA" //Required if using Global app
}'
```

{% hint style="info" %}
Note: **162\*\*\*\*\*\*\*\*\*\*\*\*38** is pagsmile's test app id for sandbox, and **MTYyNTgyOTIxNDUzMTY2Mzg6UGFnc21pbGVfc2tfZDUwMWQ1ZGNkNTI5OGQ5N2MwNmUzYjI4YjA2OWZjZmY3NDU5ZjY2NzNiMjFjMTFlYTY3NDM5MDgzOTZkOTYxNQ==** is authorization token associated with the test app id.&#x20;
{% endhint %}

{% hint style="danger" %}
Please use your own **app_id** and generate your own **authorization token** when testing.
{% endhint %}
