from flask import Flask, request, render_template, jsonify
import urllib.request
import time
import os
import urllib.request
import json 
from urllib.parse import quote 
import urllib.parse
import requests

cog_url = "https://westcentralus.api.cognitive.microsoft.com/vision/v1.0/tag"



app = Flask(__name__)

@app.route('/', methods = ['GET', 'POST'])
def fn_home():
	req_body = request.get_json()
	location = req_body['location']
	url = req_body['url']
	temp_url = "https://maps.googleapis.com/maps/api/geocode/json?address="+urllib.parse.quote_plus(location)+"&key="
	temp_url = temp_url
	print(temp_url)
	contents = urllib.request.urlopen(temp_url).read()
	out_loc = str(json.loads(contents)['results'][0]['geometry']['location']['lat']) + ',' +  str(json.loads(contents)['results'][0]['geometry']['location']['lng'])
	current_milli_time = lambda: int(round(time.time() * 1000))

	payload = "{\"url\":\""+url+"\"}"
	headers = {
		'content-type': "application/json",
		'ocp-apim-subscription-key': "46bbaaa0b8c145d6b6d16f9b5b14db53",
		'cache-control': "no-cache",
		'postman-token': "0e227de3-5938-4c8a-e1f5-385d4282c5c1"
		}

	response = requests.request("POST", cog_url, data=payload, headers=headers)
	response = response.json()
	trafficking_tags = ['girl','woman', 'outdoor','indoor', 'child', 'young', 'sand','dirt','nail','asian','chinese','polish','slave','slavery']
	score = 0
	output = ''
	for tag in response['tags']: 
		if (tag['name'] in trafficking_tags):
			output += '_' + tag['name']
			score += 1
		print(tag['name'])
	print(score)
	rank_score = output + str(score)

	if (score > 1):
		file_name = './static/upload/' + rank_score + ';;' + str(current_milli_time()) + ';;;' + out_loc + '.jpg'
		# Download the file from `url` and save it locally under `file_name`:
		urllib.request.urlretrieve(url, file_name)
	return '{"message":"200"}'

@app.route('/platform')
def fn_platform():
	arr = os.listdir('./static/upload/')
	print(arr)
	list_reports = [{"lat": float(x.split(';;;')[1].replace(".jpg", "").split(",")[0]), "lng": float(x.split(';;;')[1].replace(".jpg", "").split(",")[1]), "file": x} for x in arr]
	return render_template('index.html', list_reports = list_reports)

@app.route('/incidents')
def fn_incidents():
	arr = os.listdir('./static/upload/')
	print(arr)
	output = [{"lat": float(x.split(';;;')[1].replace(".jpg", "").split(",")[0]), "lng": float(x.split(';;;')[1].replace(".jpg", "").split(",")[1]), "file": x} for x in arr]
	return jsonify(output)

if __name__ == '__main__':
	app.run( port=8081,debug=True, host='0.0.0.0')