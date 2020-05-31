import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";
import User from "../../../entities/User";
import {
  CompleteEmailVerificationResponse,
  CompleteEmailVerificationMutationArgs,
} from "../../../types/graph";
import Verification from "../../../entities/Verification";

const resolvers: Resolvers = {
  Mutation: {
    CompleteEmailVerification: privateResolver(
      async (
        _,
        args: CompleteEmailVerificationMutationArgs,
        { req }
      ): Promise<CompleteEmailVerificationResponse> => {
        const user: User = req.user;
        const { key } = args;
        if (user.email) {
          try {
            const verification = await Verification.findOne({
              key,
              payload: user.email,
            }).catch((err) => {
              console.log(err);
            });
            if (verification) {
              user.verifiedEmail = true;
              user.save().catch((err) => {
                console.log(err);
              });
              return {
                ok: true,
                error: null,
              };
            } else {
              return {
                ok: false,
                error: "Can't verify email",
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
            error: "No email to verify",
          };
        }
      }
    ),
  },
};

export default resolvers;
