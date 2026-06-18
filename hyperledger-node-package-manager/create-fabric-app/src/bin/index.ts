#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()

program
  .name('create-fabric-app')
  .description('Zero-config Hyperledger Fabric scaffolder')
  .version('0.1.0')
  .argument('[project-name]', 'Name of your project', 'my-fabric-app')
  .action(async (projectName: string) => {
    console.log(`Creating Fabric project: ${projectName}`)
    // detectOS → installPrereqs → installFabric → scaffold
  })

program.parse();