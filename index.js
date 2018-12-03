import express from 'express'
import { Router } from 'express'
import cors from 'cors'
import sage from './services/sage/sagePayments'
import fetch from 'node-fetch'

const app = express()
const router = Router()
const allowedHosts = process.env.ALLOWED_HOSTS
const host = process.env.HOST || 'localhost'
const port = process.env.PORT || 3050

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedHosts.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.options(cors(corsOptions))

app.set('port', port)

app.use(express.json())

app.use(router.post('/api/order/process', function (req, res, next) {
    const data = req.body || null
    const paymentInit = sage.getCustomInitialization(
      {
        amount: '1.00',
        orderNumber: 'a499kk',
        cardNumber: '4111111111111111',
        cardExpirationDate: '0120',
        cvv: '123',
        billing: {
          city: 'monroe',
          state: 'ny',
          name: 'Paul Bredenberg',
          street: '88',
          postalCode: '10950'
        }
      }
    )
    console.log(paymentInit)
    console.log('process', data)
    fetch(
      'https://api-cert.sagepayments.com/paymentsjs/v1/api/payment/card',
      {
        method: 'POST',
        body: paymentInit,
        headers: {
          'Content-Type': 'application/json',
          'clientId': paymentInit.clientId
        }
      }
    )
      .then(
        response => {
          response.json()
            .then(
              json => {
                res.json(json)
              }
            )
        }
      )
      .catch(
        error => {
          console.log('error', error.json())
          res.json(error)
        }
      )
  }
))

app.use(express.json())

// Listen the server
app.listen(port, host)
console.log('Server listening on ' + host + ':' + port) // eslint-disable-line no-console
