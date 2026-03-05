import axios, { Axios, AxiosInstance } from "axios";
import FormData from "form-data";

class wassenger {
  private baseUrl = "https://api.wassenger.com/v1";
  private token =
    "17cb15bff84bdb9ccdcdb13baf366c7f2f072b095ae47860410e6512ef1663ebd9e1787fbc127f50";
  private deviceId = "681865240159402a1bef1d77";

  private client?: AxiosInstance;
  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Token: this.token,
      },
    });
  }

  public async sendSessionMessage(option: {
    group: string;
    message: string;
    quote?: string;
  }) {
    try {
      const { group, message, quote } = option;
      console.log("🚀 ` Wati Phone number", group);

      const request = await this.client?.post(
        `/messages`,
        { live: true, group: group, quote: quote, message: message },
      );

      if (!request?.status || !request.data) {
        throw "invalid response";
      }

      const response = request?.data;
      console.log("🚀 ~~ Wassanger Message Send ", response);

      return response;
    } catch (error: any) {
      console.log(
        "error in sending session message: ",
        error?.message || error
      );
    }
  }
  public async sendMessage(option: {
    phone: string;
    message: string;
    quote?: string;
  }) {
    try {
      const { phone, message, quote } = option;
      console.log("🚀 ` Wati Phone number", phone);

      const request = await this.client?.post(
        `/messages`,
        { phone: phone, quote: quote, message: message },
        {}
      );

      if (!request?.status || !request.data) {
        throw "invalid response";
      }

      const response = request?.data;
      console.log("🚀 ~~ Wassanger Message Send ", response);

      return response;
    } catch (error: any) {
      console.log(
        "error in sending session message: ",
        error?.response.data || error
      );
    }
  }
  public async createGroup(option: {
    name: string;
    description: string;
    participants: any;
  }) {
    try {
      const { name, participants, description } = option;
      console.log("🚀 group name", name);

      console.log("🚀 group Members", participants);

      console.log("🚀 group Description", description);

      const request = await this.client?.post(
        `/devices/${this.deviceId}/groups`,
        {
          name: name,
          description: description,
          participants: participants,
          permissions: {
            edit: "admins",
            send: "all",
            invite: "admins",
            approval: false,
          },
        }
      );

      if (!request?.status || !request.data) {
        throw "invalid response";
      }

      const response = await request?.data;
      console.log("🚀 Group response", response);

      return response;
    } catch (error: any) {
      // console.log("🚀 ~ wassenger ~ error:", error)
      console.error("❌ Error Creating Group", error?.response?.data);
    }
  }

  public async updateGroup(option: {
    name?: string;
    description?: string;
    participants?: any;
  }) {
    try {
      const { name, participants, description } = option;
      console.log("🚀 group name", name);

      console.log("🚀 group Members", participants);

      console.log("🚀 group Description", description);

      const request = await this.client?.post(
        `/devices/${this.deviceId}/groups`,
        {
          name: name,
          description: description,
          participants: participants,
          permissions: {
            edit: "all",
            send: "all",
            invite: "all",
            approval: false,
          },
        }
      );

      if (!request?.status || !request.data) {
        throw "invalid response";
      }

      const response = await request?.data;
      console.log("🚀 Group response", response);

      return response;
    } catch (error: any) {
      console.log("🚀 ~ wassenger ~ error:", error);
      console.error("❌ Error Creating Group", error?.response?.data);
    }
  }
}

export default wassenger;
