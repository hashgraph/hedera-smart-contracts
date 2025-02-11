import {env} from "../config/environment-variables.config";
import axios from "axios";

export async function sendToShadowingSmartContractComaparisonApi(jsonString: string) {
  const url = `${env.shadowingApiUrl}/contract-value`;

  console.log(`sendToShadowingApi: Sending POST request to: ${url}`);
  console.log('Request data:', JSON.parse(jsonString));

  const response = await axios.post(url, JSON.parse(jsonString), {
    headers: {'Content-Type': 'application/json'},
  });

  if (response.status >= 200 && response.status < 300) {
    console.log(`OK (${response.status})`);
  } else {
    throw new Error(`Error sending data to Shadowing API. Response status code: ${response.status}`);
  }
}
