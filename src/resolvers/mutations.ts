import { AuthenticationError } from 'apollo-server-lambda'
import axios from 'axios'
import { signInToken, cookie } from '~/auth'
import User from '~/models/user'

export const signInGoogle: Mutation<{ accessToken: string }> = async (
  _,
  { accessToken },
  { setHeader }
) => {
  try {
    const { data } = await axios(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        params: { access_token: accessToken },
      }
    )

    if (!data.sub)
      throw new AuthenticationError("couldn't get user id from google")

    const user = await User.signIn(data.sub)

    const jwt = signInToken(user.id, 'google')

    setHeader('Set-Cookie', cookie('auth', jwt))

    return { user, ...user, authProvider: 'google' }
  } catch (e) {
    console.error(e)
    if (e.response.data.error === 'invalid_request')
      throw new AuthenticationError('token expired')
    throw e
  }
}

export const subscribe: Mutation<{ podcasts: string[] }> = async (
  _,
  { podcasts },
  { user }
) => {
  if (!user) throw new AuthenticationError('must be logged in')
  await new User(user).subscribe(...podcasts)
}

export const unsubscribe: Mutation<{ podcasts: string[] }> = async (
  _,
  { podcasts },
  { user }
) => {
  if (!user) throw new AuthenticationError('must be logged in')
  await new User(user).unsubscribe(...podcasts)
}
