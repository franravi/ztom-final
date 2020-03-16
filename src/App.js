import  React, { Component }  from  'react';
import  Particles             from  'react-particles-js';
import  Clarifai              from  'clarifai';
import  Navigation            from  './components/Navigation/Navigation';
import  Signin                from  './components/Signin/Signin';
import  Register              from  './components/Register/Register';
import  Logo                  from  './components/Logo/Logo';
import  ImageLinkForm         from  './components/ImageLinkForm/ImageLinkForm';
import  Rank                  from  './components/Rank/Rank';
import  FaceRecognition       from  './components/FaceRecognition/FaceRecognition';
import  './App.css';

//  Clarifai API handler, configured with my API test key.
//
const app = new Clarifai.App({
  apiKey: '06e8071ec7b54e6c9e590b7fa207dee7'
});

//  Configuration options for particles
//
const particlesOptions  = {
  particles: {
    number: {
      value: 30,
      density: {
        enable: true,
        value_area: 300
      }
    },
    line_linked: {
      shadow: {
        enable: true,
        color: "#3CA9D1",
        blur: 5
      }
    }
  }
}

class   App   extends Component   {
  constructor()
  {
    super();
    this.state  =
    { input:        ''
    , imageUrl:     ''
    , box:          {}
    , route:        'signin'
    , isSignedIn:   false
    , user:         { id:       ''
                    , name:     ''
                    , email:    ''
                    , entries:  0
                    , joined:   ''
                    }
    }
  }

  loadUser = (data) =>
  {
    console.log('loadUser::data', data)

    this.setState({ user: { id:       data.id
                          , name:     data.name
                          , email:    data.email
                          , entries:  data.entries
                          , joined:   data.joined
                          }
                  })
  }

  /*
  **  componentDidMount() - Method invoked immediately after a component is mounted
  **                        (inserted into the tree).
  *//*
  **  REMOVED:  It was used to test connection to backend.
  *//*
  componentDidMount() {
    fetch('http://localhost:3000')
      .then(response => response.json())
      .then(console.log)
  }
  /**/

  /*
  **  calculateFaceLocation() - We will grab the output of clarifai and calculate a box that outlines the face detected
  **  in the image.
  */
  calculateFaceLocation = (data)  =>  {
    //  TODO:  This fails if the image has no fotos.  We have to make sure to fix this case.
    //  TODO:  What if we have multiple faces in the image?
    const clarifaiFace  = data.outputs[0].data.regions[0].region_info.bounding_box;

    //  We will grab the img html element for the input image, and grab the width and height (in case it changed).
    //
    const image   = document.getElementById('inputImage');
    const width   = Number(image.width);
    const height  = Number(image.height);
    
    return  {
      leftCol:    clarifaiFace.left_col * width,
      topRow:     clarifaiFace.top_row  * height,
      rightCol:   width   - (clarifaiFace.right_col   * width),
      bottomRow:  height  - (clarifaiFace.bottom_row  * height),
    }
  }

  /*
  **  displayFaceBox() -
  */
  displayFaceBox  = (box) => {
    this.setState({box:box});
  }

  /*
  **  onInputChange() - Here we will grab what the user typed, and store it in our 'state'.
  */
  onInputChange = (event) =>  {
    this.setState({input: event.target.value })
  }

  /*
  **  onButtonSubmit()  - Here we grab the image the user typed (and that we grabbed with
  **                      onInputChange), set it in imageUrl, and call Clarifai to do
  **                      analisis and detection of the image.
  */
  onButtonSubmit  = () => {
    //  TODO: setState is asynchronous, so there is a chance that it may still be pending
    //        to be executed when the Clarifai predict call gets executed.  To fix this, we
    //        should modify it with setState(updater, callback).  For now, I will keep this
    //        untouched to stick to the course.
    //
    this.setState({imageUrl: this.state.input});

    app.models
      .predict(
        Clarifai.FACE_DETECT_MODEL,
        this.state.input
      )
      .then(response  =>
        {
          if (response)
          {
            fetch('http://localhost:3000/image',
                  { method: 'put'
                  , headers: { 'Content-Type': 'application/json'}
                  , body: JSON.stringify( { id: this.state.user.id })
                  })
              .then(response => response.json())
              .then(count =>
              {
                //  We had this.setState({user:{entries:count}}); but it causes us to loose
                //  the user name we displayed.  We replace that line to use Object.assign(),
                //  passing the object as first argument, and the values that we need to be
                //  updated into the object as second argument.
                //
                this.setState(Object.assign(this.state.user, { entries:count }))
              })
          }
          this.displayFaceBox(this.calculateFaceLocation(response))
        })
      .catch(err =>  console.log('error', err))
  }

  /*
  **  onRouteChange() -
  */
  onRouteChange   = (route)  =>
  {
    if (route === 'signout')
    {
      this.setState({isSignedIn: false})
    }
    else if (route === 'home')
    {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  /*
  **  render()  -
  */
  render()
  {
    const { isSignedIn, imageUrl, route, box, user }  = this.state;
    let main = {};

    console.log('state', this.state, 'frontend app.js render()')

    if  (route  ===   'home')
    {
      console.log('generating homepage for user', user)

      main =
      ( <div>
          <Logo />
          <Rank
            name={user.name}
            entries={user.entries}
          />
          <ImageLinkForm
            onInputChange={this.onInputChange}
            onButtonSubmit={this.onButtonSubmit}
          />
          <FaceRecognition
            box={box}
            imageUrl={imageUrl}
          />
        </div>
      );
    }
    else if (route ===  'signin')
    {
      console.log('generating signin page')

      main =
      ( <Signin
          loadUser={this.loadUser}
          onRouteChange={this.onRouteChange}
        />
      )
    }
    else
    {
      console.log('generating register page')

      main =
      ( <Register
          loadUser={this.loadUser}
          onRouteChange={this.onRouteChange}
        />
      )
    }

    console.log('attaching all page together')
    
    return (
      <div className="App">
        <Particles
          className='particles'
          params={particlesOptions}
        />
        <Navigation
          isSignedIn={isSignedIn}
          onRouteChange={this.onRouteChange}
        />
        {main}
      </div>
    );

    /*
    return (
      <div className="App">
        <Particles
          className='particles'
          params={particlesOptions}
        />
        <Navigation
          isSignedIn={isSignedIn}
          onRouteChange={this.onRouteChange}
        />
        { route  ===   'home'
          ? <div>
              <Logo />
              <Rank
                name={user.name}
                entries={user.entries}
              />
              <ImageLinkForm
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}
              />
              <FaceRecognition
                box={box}
                imageUrl={imageUrl}
              />
            </div>
          : ( route ===  'signin'
              ? <Signin
                  loadUser={this.loadUser}
                  onRouteChange={this.onRouteChange}
                />
              : <Register
                  loadUser={this.loadUser}
                  onRouteChange={this.onRouteChange}
                />
            )
        }
      </div>
    );
    */
  }
}

export default App;
