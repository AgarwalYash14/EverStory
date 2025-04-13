import socketio
import httpx
from ..core.config import settings

# Create a Socket.IO server instance
# Use Redis adapter if configured for multi-server scaling
if settings.USE_REDIS:
    sio = socketio.AsyncServer(
        async_mode="asgi",
        cors_allowed_origins=settings.CORS_ORIGINS,
        client_manager=socketio.AsyncRedisManager(settings.REDIS_URL)
    )
else:
    sio = socketio.AsyncServer(
        async_mode="asgi",
        cors_allowed_origins=settings.CORS_ORIGINS
    )

socket_app = socketio.ASGIApp(sio)

# Socket event constants
class SocketEvents:
    NEW_POST = 'new_post'
    POST_LIKED = 'post_liked'
    NEW_COMMENT = 'new_comment'
    NEW_FRIEND_REQUEST = 'new_friend_request'
    FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted'

# Event handlers for post-related events
async def emit_new_post(post_data):
    """Notify all clients about a new post"""
    await sio.emit(SocketEvents.NEW_POST, post_data)

async def emit_post_liked(post_id, likes_count, user_id=None):
    """Notify clients that a post has been liked"""
    data = {
        'postId': post_id,
        'likes': likes_count,
        'userHasLiked': True
    }
    await sio.emit(SocketEvents.POST_LIKED, data)

async def emit_new_comment(post_id, comment_data):
    """Notify clients about a new comment"""
    data = {
        'postId': post_id,
        'comment': comment_data
    }
    await sio.emit(SocketEvents.NEW_COMMENT, data)

# Event handlers for friendship-related events
async def emit_new_friend_request(requester_id, addressee_id):
    """Notify a user about a new friend request"""
    # Find the socket ID of the addressee user
    await sio.emit(SocketEvents.NEW_FRIEND_REQUEST, {
        'requesterId': requester_id
    }, room=addressee_id)

async def emit_friend_request_accepted(addressee_id, requester_id):
    """Notify a user that their friend request was accepted"""
    # Find the socket ID of the requester user
    await sio.emit(SocketEvents.FRIEND_REQUEST_ACCEPTED, {
        'addresseeId': addressee_id
    }, room=requester_id)

# API endpoints for other services to trigger WebSocket events
async def handle_post_event(event_type, data):
    """Handle post-related events from other services"""
    if event_type == "new_post":
        await emit_new_post(data)
    elif event_type == "post_liked":
        await emit_post_liked(data["post_id"], data["likes_count"])
    elif event_type == "new_comment":
        await emit_new_comment(data["post_id"], data["comment"])

async def handle_friendship_event(event_type, data):
    """Handle friendship-related events from other services"""
    if event_type == "new_friend_request":
        await emit_new_friend_request(data["requester_id"], data["addressee_id"])
    elif event_type == "friend_request_accepted":
        await emit_friend_request_accepted(data["addressee_id"], data["requester_id"])

# User room management
@sio.event
async def join_room(sid, data):
    """Add user to a specific room for targeted notifications"""
    session = await sio.get_session(sid)
    room = data.get("room")
    if room:
        sio.enter_room(sid, room)
        print(f"User {session['user_id']} joined room {room}")

@sio.event
async def leave_room(sid, data):
    """Remove user from a specific room"""
    session = await sio.get_session(sid)
    room = data.get("room")
    if room:
        sio.leave_room(sid, room)
        print(f"User {session['user_id']} left room {room}")