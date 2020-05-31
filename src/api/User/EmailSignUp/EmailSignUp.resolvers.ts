import { Resolvers } from "../../../types/resolvers";
import {
  EmailSignUpMutationArgs,
  EmailSignUpResponse,
} from "../../../types/graph";
import User from "../../../entities/User";
import createJWT from "../../../utils/createJWT";
import Verification from "../../../entities/Verification";
import { sendVerificationEmail } from "../../../utils/sendEmail";

const resolvers: Resolvers = {
  Mutation: {
    EmailSignUp: async (
      _,
      args: EmailSignUpMutationArgs
    ): Promise<EmailSignUpResponse> => {
      const { email } = args;
      try {
        const existingUser = await User.findOne({
          email,
        }).catch((err) => {
          console.log(err);
        });
        if (existingUser) {
          return {
            ok: false,
            error: "You should log in instead",
            token: null,
          };
        } else {
          const phoneVerification = await Verification.findOne({
            payload: args.phoneNumber,
            verified: true,
          }).catch((err) => {
            console.log(err);
          });
          if (phoneVerification) {
            const newUser = await User.create({ ...args })
              .save()
              .catch((err) => {
                console.log(err);
              });
            if (newUser) {
              const emailVerification = await Verification.create({
                payload: newUser.email as string,
                target: "EMAIL",
              })
                .save()
                .catch((err) => {
                  console.log(err);
                });
              if (emailVerification) {
                await sendVerificationEmail(
                  newUser.email as string,
                  newUser.fullName,
                  emailVerification.key
                ).catch((err) => {
                  console.log(err);
                });
                const token = createJWT(newUser.id);
                return {
                  ok: true,
                  error: null,
                  token,
                };
              } else {
                return {
                  ok: false,
                  error: "Unexpected error",
                  token: null,
                };
              }
            } else {
              return {
                ok: false,
                error: "Unexpected error",
                token: null,
              };
            }
          } else {
            return {
              ok: false,
              error: "You haven't verified your phone number",
              token: null,
            };
          }
        }
      } catch (error) {
        return {
          ok: true,
          error: error.message,
          token: null,
        };
      }
    },
  },
};

export default resolvers;
