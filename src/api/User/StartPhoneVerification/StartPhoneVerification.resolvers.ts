import { Resolvers } from "../../../types/resolvers";
import {
  StartPhoneVerificationMutationArgs,
  StartPhoneVerificationResponse,
} from "../../../types/graph";
import Verification from "../../../entities/Verification";
import { sendVerificationSMS } from "../../../utils/sendSMS";

const resolvers: Resolvers = {
  Mutation: {
    StartPhoneVerification: async (
      _,
      args: StartPhoneVerificationMutationArgs
    ): Promise<StartPhoneVerificationResponse> => {
      const { phoneNumber } = args;
      try {
        const existingVerification = await Verification.findOne({
          payload: phoneNumber,
        }).catch((err) => {
          console.log(err);
        });
        if (existingVerification) {
          existingVerification.remove().catch((err) => {
            console.log(err);
          });
        }
        const newVerification = await Verification.create({
          payload: phoneNumber,
          target: "PHONE",
        })
          .save()
          .catch((err) => {
            console.log(err);
          });
        if (newVerification) {
          await sendVerificationSMS(
            newVerification.payload,
            newVerification.key
          ).catch((err) => {
            console.log(err);
          });
          return {
            ok: true,
            error: null,
          };
        } else {
          return {
            ok: false,
            error: "Unexpected error",
          };
        }
      } catch (error) {
        return {
          ok: false,
          error: error.message,
        };
      }
    },
  },
};

export default resolvers;
