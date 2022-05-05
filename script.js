const server = 'localhost:3001';
let USERS = [];
let USER = [];
let COMMENTS = [];
let REPLYING_TO_COMMENT = null;
const commentBox = document.getElementById('comment-box');
const commentList = document.getElementById('comment-list');
const commentText = document.getElementById('comment-text');
const commentItemTemplate = document.getElementById('comment-item-template');
const getCommentID = (id) => `comment-item-${id}`;
const commentsDefaultPlaceholder = 'What are your thoughts?';

/**
 * POST Request
 * @param relativeUrl
 * @param data
 * @returns {Promise<any>}
 * @constructor
 */
async function POST(relativeUrl = '', data = {}) {
    const url = `http://${server}/${relativeUrl}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json();
}

/**
 * GET Request
 * @param relativeUrl
 * @param queries
 * @returns {Promise<any>}
 * @constructor
 */
async function GET(relativeUrl = '', queries = {}) {
    const url = `http://${server}/${relativeUrl}?` + new URLSearchParams(queries);
    const response = await fetch(url, {
        method: 'GET'
    });
    return response.json();
}

/**
 * Initializes state
 *      Sets current user
 *      Fetches comments
 * @returns {Promise<void>}
 */
async function init() {
    // Step 1: Fetch users
    USERS = await GET('getUsers');
    // Step 2a: Randomize and set one of the users as current user
    USER = USERS[(Math.random() * USERS.length) | 0];
    console.log('Current user is', USER);
    // Step 2b: Init current user;
    commentBox.querySelector('.user-icon').src = USER.photoUrl;
    // Step 3: Fetch comments
    COMMENTS = await GET('getComments');
}

/**
 * Lists all the existing comments in the discussion
 */
function listAllComments() {
    const parentComments = COMMENTS.filter(c => !c.parentCommentId);
    const childComments = COMMENTS.filter(c => !!c.parentCommentId);
    // First render parent comments
    parentComments.forEach((comment) => {
        renderComment(comment);
    })
    // Then, render child comments
    childComments.forEach((comment) => {
        renderComment(comment);
    })
}

/**
 * Builds the commentItem HTML node
 * @param comment
 * @returns {Node}
 */
function getCommentItem(comment) {
    // Step 1: Iterate over comments and get props
    const { id, userId, text, date, dateFormatted, voteCount, parentCommentId } = comment;
    // Step 2: Find the user who wrote this comment
    const { name, photoUrl } = USERS.filter(user => user.id === userId)[0];
    // Step 3: Create a node from commentItemTemplate
    const commentItem = commentItemTemplate.content.cloneNode(true);
    // Step 4: Set comment props
    const commentItemDiv = commentItem.querySelector('.comment-item');
    commentItemDiv.id = getCommentID(id);
    commentItemDiv.className += parentCommentId ? ' child-comment' : '';
    commentItem.querySelector('.user-icon').src = photoUrl;
    commentItem.querySelector('.name').innerHTML = name;
    commentItem.querySelector('.date-time').innerHTML = dateFormatted;
    commentItem.querySelector('.comment-text').innerHTML = text;
    commentItem.querySelector('.vote-count').innerHTML = voteCount > 0 ? `(${voteCount})` : null;
    commentItem.querySelector('.upvote').onclick = (e) => { upvote(id) };
    commentItem.querySelector('.reply').onclick = (e) => { reply(id) };
    return commentItem;
}

/**
 * Inserts a HTML Node for comment
 * @param comment
 * @param insertAtEnd
 */
function renderComment(comment, insertAtEnd = true) {
    const { parentCommentId } = comment
    // Step 1: Get commentItem
    const commentItem = getCommentItem(comment);
    // Step 2: If parentCommentId is present, insertion slightly differs
    if (parentCommentId) {
        // Step 2a: get parentComment
        const parentComment = document.getElementById(getCommentID(parentCommentId));
        // Step 2b:
        parentComment.className += ' has-child';

        parentComment.appendChild(commentItem);

        /*
        // Step 2c: get parentComment's next sibling (There is no insert after)
        const parentCommentElementSibling = parentComment.nextElementSibling;
        if (parentCommentElementSibling) {
            // Step 2d: If parentCommentElementSibling is present, then insert before it
            commentList.insertBefore(commentItem, parentCommentElementSibling);
        } else {
            // Step 2e: If parentCommentElementSibling is not present, then simply add to end of list
            commentList.appendChild(commentItem);
        }
         */
        return;
    }
    // Step 3: Insert comment for cases without parentCommentId
    if (insertAtEnd) {
        commentList.appendChild(commentItem);
    } else {
        commentList.prepend(commentItem);
    }
}

/**
 * Upvote
 * @param commentId
 * @returns {Promise<void>}
 */
async function upvote(commentId) {
    // Step 1: Mark upvote in backend
    const { voteCount } = await POST('upvote', {
        userId: USER.id,
        commentId
    });
    // Step 2: Update value in UI
    const commentElement = document.getElementById(getCommentID(commentId));
    commentElement.querySelector('.vote-count').innerHTML = voteCount > 0 ? `(${voteCount})` : null;
}

async function reply(commentId) {
    // Step 1: Set REPLYING_TO_COMMENT to commentId
    REPLYING_TO_COMMENT = commentId;
    // Step 2: Get comment and user details
    const comment = COMMENTS.find(c => c.id === commentId);
    const user = USERS.find(u => u.id === comment.userId);
    // Step 3: Set placeholder to reflect that the user is replying to a comment
    commentText.placeholder = `Replying to ${user.name}'s comment`
}

/**
 * Add Comment
 * @returns {Promise<void>}
 */
async function addComment () {
    const text = commentText.value;
    // Step 1: Make sure text is valid
    if (!text || text.length === 0) {
        return;
    }
    // Step 2: Store comment in backend
    const comment = await POST('comment', {
        userId: USER.id,
        text,
        parentCommentId: REPLYING_TO_COMMENT || null
    });
    // Step 3: Set date correctly
    comment.dateFormatted = 'just now';
    // Step 4: Insert comment (at the start)
    renderComment(comment, false);
    // Step 5: Cleanup
    REPLYING_TO_COMMENT = null;
    commentText.value = null;
    commentText.placeholder = commentsDefaultPlaceholder;
}

(async () => {
    await init();
    listAllComments();
})();