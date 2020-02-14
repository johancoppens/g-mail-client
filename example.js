const gMail = require('./index')
const conf = require('./config')
const main = async () => {
  try {
    // Initialize
    await gMail.init(conf)

    let res = null

    res = await gMail.send({
      // to: ['Johan Coppens <johan.coppens@edugolo.be>', 'Helpdesk<helpdesk@edugolo.be>'],
      to: ['Johan Coppens <johan.coppens@edugolo.be>'],
      // to: 'Johan Coppens <johan.coppens@edugolo.be>',
      subject: 'test',
      htmlMessage: '<pre>Test</pre>'
    })
    console.log(res)
  } catch (e) {
    console.log(e)
  }
}
main().catch(console.error)
