import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

export const handler = async () => {
  try {
    const command = new GetSecretValueCommand({ SecretId: "your-secret-name" });
    const response = await client.send(command);

    if (response.SecretString) {
      const secret = JSON.parse(response.SecretString);
      console.log("Secret:", secret);
      return secret;
    }

    throw new Error("SecretString is empty");
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }
};
