
# Forter + Cloudflare integration #

Forter is a powerful solution for preventing account abuse at sign-up and preventing account take-overs at sign-in.

Cloudflare provides a powerful CDN that drives much of the web, and provides a bot mitigation solution (among many other services).

Using a Cloudflare web worker, you can incorporate Forter's capabilities into your CDN layer, ensuring that fraudsters, hackers, and bots are bounced at the edge, without ever touching your core infrastructure or user accounts.

This project contains a Cloudflare worker built using the Cloudflare Wrangler development tool.

This Cloudflare worker is designed to proxy POST requests to an origin's `/login` endpoint.

There is an accompanying project available [here](https://github.com/tomgsmith99/forter-example-origin) that provides:

a front end - which renders a login form

a back end - which represents the origin server (an identity provider or credential provider). 

## Prerequisites ##

A Cloudflare account

A Forter account

## Components ##

The major components in this solution are the NodeJS app and the Cloudflare Worker.

You can see a web sequence diagram of the overall flow [here](https://tomgsmith99-images.s3.amazonaws.com/forter/forter_cloudflare.png).

### Cloudflare Worker ###

* The Cloudflare Worker (`worker.js`) accepts POSTs to the /login endpoint
* When it user credentials at the edge, it forwards them to the origin user directory
* If the credentials are incorrect, then the worker sends a 401 to the client
* If the credentials are correct, then the worker sends the login event and Forter token to Forter
* Forter responds with an `approve`, `verification_required`, or `decline` recommendation
* If the recommendation is `decline`, then the Worker sends a 401 to the client
* The `verification_required` recommendation means that the user should be presented with an MFA challenge. This logic is not included here, but, depending on your MFA solution, the MFA handshake could be managed by the worker as well.
* The `approve` recommendation is a green light, and a 200 is sent to the client.

## Setup: Cloudflare Worker ##

The Cloudflare worker is set up to be used with Wrangler, Cloudflare's local dev environment.

Copy the `wrangler_example.toml` file to wrangler.toml and update the values for your environment.

Note: the value `FORTER_KEY_ENCODED` should be a base64-encoded string:

str(base64encode(forter_key:))

Import `src/index.js` into your Wrangler project.

Attach the Worker to the `/login` endpoint of your origin.
