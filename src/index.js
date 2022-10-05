/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npx wrangler dev src/index.js` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.js --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// this function allows for testing various Forter responses
async function get_ip(username, ip_address) {

	const username_lc = username.toLowerCase()

	if (username_lc.includes('approve') || username_lc.includes('lois.lane')) {
	  return '0.0.0.1'
	}
	else if (username_lc.includes('decline') || username_lc.includes('lex.luthor')) {
	  return '0.0.0.2'
	}
	else if (username_lc.includes('verify') || username_lc.includes('clark.kent')) {
	  return '0.0.0.4'
	}
	else {
	  return ip_address
	}
}
  
async function handleRequest(request, env) {

	if (request.method === 'POST') {

		const reqBody = await request.json()
	
		// Pull the username (and password in prod) from the request body
		const { username } = reqBody

		const config = {
			body: JSON.stringify({ username: username }),
			headers: {
				'Content-type': 'application/json; charset=UTF-8'
			},
			method: 'post'
		}

		// check the user's credentials against the user directory
		// const modifiedRequest = new Request(url, config)

		const modifiedRequest = new Request(env.USER_DIRECTORY_URL, config)

		const credsResponse = await fetch(modifiedRequest)
	
		// if the user directory says the credentials are good
		// then call Forter, else send response (usually 401) to client 
		if (credsResponse.status == 200) {
	
			const user_id = "e520-ba9a-367-60b" // this value should come from the user directory
		
			const ip_address = await get_ip(username, request.headers.get('CF-Connecting-IP'))
		
			var myHeaders = new Headers()
			myHeaders.append("api-version", env.FORTER_API_VERSION)
			myHeaders.append("Content-Type", "application/json")
			myHeaders.append("Authorization", "Basic " + env.FORTER_KEY_ENCODED)
		
			var raw = JSON.stringify({
				"accountId": user_id,
				"connectionInformation": {
				"customerIP": ip_address,
				"userAgent": request.headers.get('user-agent')
				},
				"loginMethodType": "PASSWORD",
				"loginStatus": "SUCCESS",
				"eventTime": Date.now()
			})
		
			var requestOptions = {
				method: 'POST',
				headers: myHeaders,
				body: raw,
				redirect: 'follow'
			}
		
			const forter_url = 'https://' + env.FORTER_SITE_ID + '.api.forter-secure.com/v2/accounts/login/' + user_id
		
			const forter_response = await fetch(forter_url, requestOptions)
		
			const forter_response_obj = await forter_response.json()
		
			console.log("the forter decision is: " + JSON.stringify(forter_response_obj))
	
			if (forter_response_obj.forterDecision == "DECLINE") {
				return new Response('', { status: 401 })
			}
			else {
				return new Response(JSON.stringify(forter_response_obj), { 
					status: 200,
					headers: {
						'content-type': 'application/json',
					}
				})
			}
		}
		else {
			return new Response(credsResponse.body, {
				status: credsResponse.status
			})
		}
	}
	else {
		const init = {
			headers: {
			  'content-type': 'text/html;charset=UTF-8',
			},
		};

		const response = await fetch(env.ORIGIN, init);
		const r = await response.text()
		return new Response(r, init);
	}
}

export default {
	async fetch(request, env) {

		return handleRequest(request, env);

	},
};
