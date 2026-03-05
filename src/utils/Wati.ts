import { Axios } from "axios";
import FormData from "form-data";
class Wati {
  private baseUrl = "https://live-mt-server.wati.io/379332";
  private token =
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlN2VjMmQ5YS1kYjk4LTQwYmMtOTJiOC0zYzdhMDdlMGIwYTMiLCJ1bmlxdWVfbmFtZSI6InZpbm9ka3VtYXJzd2FtaTE5OTFAZ21haWwuY29tIiwibmFtZWlkIjoidmlub2RrdW1hcnN3YW1pMTk5MUBnbWFpbC5jb20iLCJlbWFpbCI6InZpbm9ka3VtYXJzd2FtaTE5OTFAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMTIvMjUvMjAyNCAwNjowMDo1NCIsInRlbmFudF9pZCI6IjM3OTMzMiIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.J7ee76FkInKUA32LxJLGlz-y9G5_JXdjlNkNEbCH6lQ";
  private client?: Axios;
  constructor() {
    this.client = new Axios({
      baseURL: this.baseUrl,
      headers: {
        Authorization: this.token,
      },
    });
  }

  public async sendSessionMessage(option: { phone: string; message: string }) {
    try {
      const { phone, message } = option;
      console.log("🚀 ~ Wati Phone Number", phone);
      const form = new FormData();
      form.append("messageText", message);

      const request = await this.client?.post(
        `/api/v1/sendSessionMessage/${phone}`,
        form,
        { ...form.getHeaders() }
      );

      if (!request?.status || !request.data) {
        throw "invalid response";
      }

      const response = request.data;
      console.log("🚀 ~ Wati ~ sendSessionMessage ~ data:", request.data);

      return response;
    } catch (error) {
      console.log("error in sending session message: ", error);
    }
  }
}

export default Wati;
