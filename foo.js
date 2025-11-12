// node >=18

async function main() {
	let URL = 'https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour';
	const res = await fetch(URL, {
         headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15' },

		redirect: 'follow' // default ändå, men tydligt
	});
	console.log('status:', res.status, res.statusText);
	console.log('final URL:', res.url);
	console.log('headers:', Object.fromEntries(res.headers));
	const text = await res.text();
	console.log('body sample:', text.slice(0, 500));
}

main();
