import { APIAxios } from "@/utils/axios";
import { useMutation } from "@tanstack/react-query";

interface sendInviteProps {
  email: string;
  role: string;
  business_ids?: number[];
}
const sendInvite = async (data: sendInviteProps) => {
  const response = await APIAxios.post("/auth/invite-user/", data);
  return response.data;
};

export const UseSendInviteToEmployee = () => {
  return useMutation({
    mutationFn: sendInvite,
    mutationKey: ["send-invite-to-employee"],
  });
};
