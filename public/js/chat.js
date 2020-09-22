const socket = io()

// Selecting Elements
const $messageForm = document.getElementById('message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.getElementById('send-location')
const $messages = document.getElementById('messages')
const $locations = document.getElementById('locations')

// Templates
const messageTemplate = document.getElementById('message-template').innerHTML
const locationMessageTemplate = document.getElementById('location-message-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoscroll = () => {
    // New message element
    const $newMesssage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMesssage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMesssageHeight = $newMesssage.offsetHeight + newMessageMargin
    
    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMesssageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.getElementById('sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    
    // Disable
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value

    if($messageFormInput.value === ''){
        alert('Please provide a message')
        $messageFormButton.removeAttribute('disabled')
    } else{
        $messageFormButton.removeAttribute('disabled')
        // Enable
        socket.emit('sendMessage', message, (error) => {
            if (error) {
                return console.log(error)
            }
            console.log('Message Delivered!')
        })
        $messageFormInput.value = ''
        $messageFormInput.focus()
    }
    
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation isn\'t by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')
    
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})