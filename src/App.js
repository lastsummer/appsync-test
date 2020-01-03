import React from 'react';

import AWSAppSyncClient, { AUTH_TYPE } from "aws-appsync"
import uuid from 'uuid/v4'
import gql from "graphql-tag"
import { listTalks as ListTalks } from './graphql/queries'
import { createTalk as CreateTalk } from './graphql/mutations'


const getOIDCToken = async () => await ''

const client = new AWSAppSyncClient({
  url: "",
  region: "ap-northeast-1",
  auth: {
    type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
    jwtToken: () => getOIDCToken()
  }
})

const CLIENT_ID = uuid()


class App extends React.Component {
  state = {
    talks: []
  }

  createTalk = async() => {
    const { name, description, speakerBio, speakerName } = this.state
    if (name === '' || description === '' || speakerBio === '' || speakerName === '') return

    const talk = { name, description, speakerBio, speakerName, clientId: CLIENT_ID }
    const talks = [...this.state.talks, talk]
    this.setState({
      talks, name: '', description: '', speakerName: '', speakerBio: ''
    })
    console.log('talk--->', talk)
    await this.postData(talk)
    /*
    try {
      await API.graphql(graphqlOperation(CreateTalk, { input: talk }))
      console.log('item created!')
    } catch (err) {
      console.log('error creating talk...', err)
    }
    */
  }

  onChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  async getList(){
    await client.hydrated()
    const data = await client.query({ 
      query: gql(ListTalks), 
      options: {
        fetchPolicy: 'network-only'
      }
    })
    console.log('results of query: ', data);
    return data
  }

  async postData(talk){
    return client.hydrated().then(function (client) {
      client.mutate(({ 
        mutation: gql(CreateTalk), 
        variables: { input: talk }
      })).then(function logData(data) {
          console.log('results of query: ', data);
          return data
        })
        .catch(console.error);
      
    })
  }


  async componentDidMount() {
    try {
      
      const talkData = await this.getList()
      console.log('talkData:', talkData)
      this.setState({
        talks: talkData.data.listTalks.items
      })
      /*
      const talkData = await API.graphql(graphqlOperation(ListTalks))
      console.log('talkData:', talkData)
      this.setState({
        talks: talkData.data.listTalks.items
      })
      */
    } catch (err) {
      console.log('error fetching talks...', err)
    }
  }

  render() {
    return (
      <>
        <input
          name='name'
          onChange={this.onChange}
          value={this.state.name}
          placeholder='name'
        />
        <input
          name='description'
          onChange={this.onChange}
          value={this.state.description}
          placeholder='description'
        />
        <input
          name='speakerName'
          onChange={this.onChange}
          value={this.state.speakerName}
          placeholder='speakerName'
        />
        <input
          name='speakerBio'
          onChange={this.onChange}
          value={this.state.speakerBio}
          placeholder='speakerBio'
        />
        <button onClick={this.createTalk}>Create Talk</button>
        {
          this.state.talks.map((talk, index) => (
            <div key={index}>
              <h3>{talk.speakerName}</h3>
              <h5>{talk.name}</h5>
              <p>{talk.description}</p>
            </div>
          ))
        }
      </>
    )
  }
}

export default App;
