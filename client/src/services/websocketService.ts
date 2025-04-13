import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';

// Event types for type safety
export enum SocketEvents {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    NEW_POST = 'new_post',
    POST_LIKED = 'post_liked',
    NEW_COMMENT = 'new_comment',
    NEW_FRIEND_REQUEST = 'new_friend_request',
    FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted'
}

// Socket.io client instance
let socket: Socket | null = null;

// Initialize WebSocket connection
export const initializeSocket = (token: string): Socket => {
    if (socket) return socket;

    socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080', {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true,
    });

    return socket;
};

// Close WebSocket connection
export const closeSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// Custom hook for using WebSocket
export const useSocket = (token: string | null) => {
    const [isConnected, setIsConnected] = useState(false);
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        if (!token) return;

        const socket = initializeSocket(token);

        // Connection events
        socket.on(SocketEvents.CONNECT, () => {
            setIsConnected(true);
            console.log('WebSocket connected');
        });

        socket.on(SocketEvents.DISCONNECT, () => {
            setIsConnected(false);
            console.log('WebSocket disconnected');
        });

        // Post events
        socket.on(SocketEvents.NEW_POST, () => {
            // Invalidate posts query to refetch with new data
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        });

        socket.on(SocketEvents.POST_LIKED, (data) => {
            // Update post in cache directly
            queryClient.setQueryData(['post', data.postId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    likes: data.likes,
                    userHasLiked: data.userHasLiked
                };
            });

            // Also invalidate posts list to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        });

        socket.on(SocketEvents.NEW_COMMENT, (data) => {
            // Similar to likes, update the post with new comment
            queryClient.invalidateQueries({ queryKey: ['post', data.postId] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        });

        // Friend events
        socket.on(SocketEvents.NEW_FRIEND_REQUEST, () => {
            queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
        });

        socket.on(SocketEvents.FRIEND_REQUEST_ACCEPTED, () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
        });

        return () => {
            // Clean up listeners when component unmounts
            socket.off(SocketEvents.CONNECT);
            socket.off(SocketEvents.DISCONNECT);
            socket.off(SocketEvents.NEW_POST);
            socket.off(SocketEvents.POST_LIKED);
            socket.off(SocketEvents.NEW_COMMENT);
            socket.off(SocketEvents.NEW_FRIEND_REQUEST);
            socket.off(SocketEvents.FRIEND_REQUEST_ACCEPTED);
        };
    }, [token, queryClient, dispatch]);

    return { isConnected };
};