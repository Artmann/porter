import 'dotenv/config'
import { log } from 'tiny-typescript-logger'

import { GraphQLClient } from './app/graphql-client'
import { RailwayClient } from './app/railway-client'

async function main() {
  const railwayApiEndpoint = 'https://backboard.railway.app/graphql/v2'
  const railwayApiToken = process.env.RAILWAY_API_TOKEN

  if (!railwayApiToken) {
    throw new Error('RAILWAY_API_TOKEN not found in environment variables')
  }

  const graphQLClient = new GraphQLClient(railwayApiEndpoint, railwayApiToken)
  const railwayClient = new RailwayClient(graphQLClient)

  const projects = await railwayClient.listProjects()

  log.info(projects)

  for (const project of projects) {
    const services = await railwayClient.listServices(project.id)

    log.info(services)
  }
}

main().catch((error) => {
  log.error(error)

  process.exit(1)
})
