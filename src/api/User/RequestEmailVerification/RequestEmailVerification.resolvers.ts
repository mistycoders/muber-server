import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";
import Verification from "../../../entities/Verification";
import User from "../../../entities/User";
import { sendVerificationEmail } from "../../../utils/sendEmail";
import { RequestEmailVerificationResponse } from "../../../types/graph";

const resolvers: Resolvers = {
  Mutation: {
    RequestEmailVerification: privateResolver(
      async (_, __, { req }): Promise<RequestEmailVerificationResponse> => {
        const user: User = req.user;
        if (user.email && !user.verifiedEmail) {
          try {
            const oldVerification = await Verification.findOne({
              payload: user.email,
            }).catch((err) => {
              console.log(err);
            });
            if (oldVerification) {
              oldVerification.remove().catch((err) => {
                console.log(err);
              });
            }
            const newVerification = await Verification.create({
              payload: user.email,
              target: "EMAIL",
            })
              .save()
              .catch((err) => {
                console.log(err);
              });
            if (newVerification) {
              await sendVerificationEmail(
                user.email,
                user.fullName,
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
        } else {
          return {
            ok: false,
            error: "Your user has no email to verify",
          };
        }
      }
    ),
  },
};

export default resolvers;
