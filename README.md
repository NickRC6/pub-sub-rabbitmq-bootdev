# learn-pub-sub-typescript-starter (Peril)

This is the starter code used in Boot.dev's [Learn Pub/Sub](https://www.boot.dev/courses/learn-pub-sub-rabbitmq-typescript) course.

# RabbitMQ Backpressure Demo

A small TypeScript project that demonstrates **pub/sub messaging with RabbitMQ** and shows how **backpressure** builds up when messages are produced faster than they can be consumed.

## Overview

This project simulates a simple game logging system:

- A **client** publishes game log events
- A **server** consumes and processes those logs
- RabbitMQ sits in the middle as the message broker

It also includes a `spam` command to intentionally flood the queue, making it easy to observe backpressure in action.

## Features

- RabbitMQ pub/sub messaging
- Topic-based routing
- Client/server architecture in TypeScript
- Queue backpressure demonstration
- Configured consumer prefetching for controlled message processing

## How Backpressure Works Here

When the client publishes messages faster than the server can process them:

- the queue grows
- pending messages accumulate
- processing slows behind production

This project demonstrates that behavior by:

- publishing large bursts of log messages
- limiting the consumer to process messages one at a time
- making queue growth visible in the RabbitMQ UI

## Tech Stack

- TypeScript
- Node.js
- RabbitMQ

## Project Structure

```text
src/
  client/      # client commands and publishing
  server/      # server-side consumers and handlers
  internal/
    gamelogic/ # game log generation and logic
    pubsub/    # publish/subscribe helpers
    routing/   # routing key helpers
Running the Project
Start RabbitMQ, then run the server and client in separate terminals.
```

## Example workflow:

Start RabbitMQ
Start the server
Start the client
Use provided commands to play the game from started Clients
Watch queue behavior in the RabbitMQ management UI
