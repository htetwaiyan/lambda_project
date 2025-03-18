import axios from "axios";

export const handler = async () => {
  const secretName = "your-secret-name";

  try {
    const response = await axios.get(
      `http://localhost:2773/secretsmanager/get?secretId=${secretName}`,
      {
        headers: {
          "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN,
        },
      }
    );

    console.log("Secret Value:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching secret:", error);
    throw error;
  }
};
