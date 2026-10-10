import { Composition } from 'remotion'
import './fonts'
import { Video } from './Video'
import T from './timeline.json'

export const RemotionRoot = () => (
  <Composition id="MissingBlue" component={Video} durationInFrames={T.total} fps={T.fps} width={1920} height={1080} />
)
