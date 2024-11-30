const express = require('express')
const router = express.Router()
const passport = require('passport')

router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['email', 'profile']
    })
)

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),  // session 預設 true
    (req, res) => {
        res.send({
            status: true,
            data: {
                id: req.user.id,
                name: req.user.displayName,
                email: req.user.emails,
                provider: req.user.provider
            }
        })
    }
)

module.exports = router