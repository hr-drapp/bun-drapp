import axios, { Axios, AxiosInstance } from "axios";
import FormData from "form-data";

class Whapi {
  private baseUrl = "https://gate.whapi.cloud/";
  private token = "iKjPqVFsSypF1Gd7JNFFnl5htKm1SQHf";

  private client?: AxiosInstance;
  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        authorization: `Bearer ${this.token}`,
      },
    });
    // (globalThis as any).sendMessage = this.sendMessage.bind(this);
  }

  public async sendMessage(option: {
    group: string;
    message: string;
    quote?: string;
  }) {
    try {
      const { group, message, quote } = option;
      console.log("Whapi Body", group, message, quote);
      const request = await this.client?.post(
        `/messages/text`,
        {
          typing_time: 2,
          to: group,
          quoted: quote || "",
          body: message,
        },
        {
          validateStatus: (status) => {
            return status >= 200 && status <= 500;
          },
        }
      );
      console.log("🚀 ~ Whapi ~ sendMessage ~ request:", request?.data);

      if (!request?.status || !request.data) {
        // throw new Error("invalid response");
        return;
      }
      // console.log("Whapi Response", request.data);

      return request.data;
    } catch (error: any) {
      console.error("❌ Error", error?.response?.data);
    }
  }

  public async createGroup(option: {
    name: string;
    description: string;
    participants: any;
  }) {
    try {
      const { name, participants, description } = option;
      // console.log("🚀 group name", name);

      console.log("🚀 group Members", participants);

      console.log("🚀 group Description", description);

      const request = await this.client?.post(`/groups`, {
        subject: name,
        participants: participants,
      });

      if (!request?.status || !request.data) {
        throw "invalid response";
      }

      const response = await request?.data;
      // console.log("🚀 Group response", response);

      await this.updateGroup({
        description: description,
        groupId: response.group_id,
      });
      return response;
    } catch (error: any) {
      // console.log("🚀 ~ wassenger ~ error:", error)
      console.error("❌ Error Creating Group", error?.response?.data);
    }
  }

  public async updateGroup(option: { description?: string; groupId?: string }) {
    try {
      const { description, groupId } = option;

      console.log("🚀 group Description", description);

      const request = await this.client?.put(`/groups/${groupId}`, {
        description: description,
      });

      if (!request?.status || !request.data) {
        throw "invalid response";
      }

      const response = await request?.data;
      console.log("🚀 Group  Update Response response", response);

      return response;
    } catch (error: any) {
      console.log("🚀 ~ wassenger ~ error:", error);
      console.error("❌ Error Creating Group", error?.response?.data);
    }
  }
}

export default Whapi;
